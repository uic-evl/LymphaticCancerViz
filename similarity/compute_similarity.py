import sys, csv, copy, json
import unicodedata, datetime
from pprint import pprint
from collections import OrderedDict
from Graph import Graph
from Patient import Patient
import Similarity as sim

# A list of all the patients that are read in
patients_pointer = {}
rp_patients = {}
non_rp_patients = {}

patient_attr = {}
lymph_nodes = []
adjacency_matrix = []
g_sorted_scores = {}

tanimoto_edges_output = {}
tanimoto_nodes_output = {}
tanimoto_bigrams_output = {}
tanimoto_weighted_output = {}
jaccard_output = {}

output = ""
ids = []
rp_ids = []
non_rp_ids = []

max_nodes = 0

# output file
f = None
m = None
now = datetime.datetime.now()


# Write the patient metadata anc scores to a CSV file
def write_to_csv(current_patient, patient_order, scores):
    ordered_scores = []
    for mid in sorted(ids):
        if mid == current_patient.get_id():
            ordered_scores.append("-1.0")
        else:
            midx = patient_order.index(mid)
            ordered_scores.append(scores[midx])

    g_sorted_scores[current_patient.get_id()] = ordered_scores

    order = ",".join(str(x) for x in ordered_scores)
    m.write("Patient " + str(current_patient.get_id()) + ",")
    m.write(order)
    m.write('\r')

    return


# Write out the patient metadata and scores to the JSON file for the web interface
def write_to_json(current_patient, patient_order, scores):
    # write the output
    f.write('{ "id": ' + str(current_patient.get_id()) + ', "gender": "' + current_patient.get_gender() + '", ')
    f.write('"position": "' + current_patient.get_tumor_position() + '", ')

    for col_attr in patient_attr[str(current_patient.get_id())]:
        val = patient_attr[str(current_patient.get_id())][col_attr]
        f.write('"' + col_attr + '": "' + val + '", ')

    output_writer = ",".join(str(e) for e in patient_order)
    f.write('"similarity": [' + output_writer + '], ')

    output_writer = ",".join(str(round(e, 4)) for e in scores)
    f.write('"scores": [' + output_writer + '], ')

    patient_out_nodes = current_patient.get_output_nodes()
    out_nodes = patient_out_nodes if len(patient_out_nodes) > 0 else \
        current_patient.get_graph("Left").get_node_positions() + current_patient.get_graph("Right").get_node_positions()
    output_writer = '","'.join(str(no).upper() for no in out_nodes)
    f.write('"nodes": ["' + output_writer + '"] }')

    # check for end of data
    if current_patient.get_id() == patients_pointer.keys()[-1]:
        f.write("\n")
    else:
        f.write(",\n")


# Write out the similarity matrix to a csv file
def write_to_scores(fileName, header):
    # read in the json file
    json_data = json.load(open(fileName, 'r'), object_pairs_hook=OrderedDict)
    # create a csv vile
    idx = fileName.rfind('/')
    name = fileName[idx:-5] + '_Data_and_Scores_' + str(now.month) + '_' + str(now.year) + '.csv'
    name = name[1].upper() + name[2:]
    csv_name = './data/scores/' + name
    csv_file = open(csv_name, 'w')

    # our writing object
    csv_writer = csv.writer(csv_file, lineterminator='\n')
    # iterate over the json attributes and write them out
    count = 0
    for atr in json_data:
        values = atr.values()
        json_header = atr.keys()
        values_all = []
        if count == 0:
            header_titles = []
            col = 0
            # parse the arrays out of the json
            for h in json_header:
                if type(values[col]) is list and h == "nodes":
                    for ii in range(0, max_nodes):
                        header_titles.append(h + '/' + str(ii))
                elif type(values[col]) is not list:
                    header_titles.append(h)
                col += 1
            # write the header
            header_list = header.split(",")
            csv_writer.writerow(header_titles + header_list)
            count += 1
        # parse the values
        col = 0
        for val in values:
            if type(val) is list and json_header[col] == "nodes":
                for ii in range(0, max_nodes):
                    if ii < len(val):
                        values_all.append(val[ii])
                    else:
                        values_all.append('')
            elif type(val) is not list:
                values_all.append(val)
            col += 1

        values_scores = g_sorted_scores[values[0]]

        # write the values
        csv_writer.writerow(values_all + values_scores)

    csv_file.close()


def write_patient_data(scores_all):
    global patients_pointer
    for keyA, patientA in patients_pointer.iteritems():
        scores = scores_all[keyA]
        write_to_csv(patientA, scores[0], scores[1])
        write_to_json(patientA, scores[0], scores[1])


def init_matrix_file(m_header):
    global m
    m = open('./data/matrices/' + output + '_' + 'matrix.csv', 'w')
    m.write(",")
    m.write(m_header)
    m.write('\r')


def read_matrix_data(m_file):
    global lymph_nodes
    global adjacency_matrix

    with open(m_file, 'r') as mCsvFile:
        # create a csv reader
        mReader = csv.reader(mCsvFile, delimiter=',')
        # iterate over the rows of the csv file
        for row in mReader:

            # first row, read the lymph node headers
            if not row[0]:
                lymph_nodes = row[1:]
            else:
                adjacency_matrix.append(row[1:])


def get_patient_graphs(current_patient):
    # get the left graph of current_patient A
    graph_a_left = current_patient.get_graph("Left")
    graph_a_right = current_patient.get_graph("Right")

    # if one of the graphs is devoid of infected nodes, only look at one
    if len(graph_a_left.get_nodes()) == 0:
        return graph_a_right
    elif len(graph_a_right.get_nodes()) == 0:
        return graph_a_left
    # both have infected nodes on each side of the head
    else:
        return [graph_a_left, graph_a_right]


def get_difference_count(graph_a, graph_b):
    return len(list(set(graph_a.get_nodes()) - set(graph_b.get_nodes())))


def compare_neighbor_weight(graph_a, graph_b, curr_node):
    neighbor_weight_a = graph_a.get_value_at(curr_node, curr_node)
    neighbor_weight_b = graph_b.get_value_at(curr_node, curr_node)
    return neighbor_weight_a / neighbor_weight_b


def compute_neighbors_similarity(graph_a, graph_b):
    # get the nodes in graph A and graph B
    aNodes = graph_a.get_nodes()
    bNodes = graph_b.get_nodes()

    # create a new graph that is the size of |A| x |B|
    neighbors = Graph(aNodes, bNodes)

    for a_node in aNodes:
        if a_node in bNodes:
            # get the two weights of the graphs, then average their value
            # will not always be one if a graph has a bilateral node
            weight = compare_neighbor_weight(graph_a, graph_b, a_node)
            neighbors.set_value_at(a_node, a_node, weight)
    return neighbors


def compute_graph_similarity(graph_a, graph_b):
    neighbor_similarity_matrix = compute_neighbors_similarity(graph_a, graph_b)

    # store the sum of the neighbor matching weights
    summed_weights = 0

    for i in range(len(neighbor_similarity_matrix.get_rows())):
        curr_row = neighbor_similarity_matrix.get_row(i)
        summed_weights = summed_weights + max(curr_row)

    # normalize the weights with the minimum number of nodes
    return float(summed_weights)


def sort_by_scores(scores, other_patients):

    # small function to sort the patients by their scores
    def get_score(m_idx):
        jj = other_patients.keys().index(m_idx)
        # we want the first element to stay the same
        return scores[jj]

    # sort the patients by their scores
    sorted_by_score = sorted(other_patients, key=get_score, reverse=True)
    sorted_scores = sorted(scores, reverse=True)
    return [sorted_by_score, sorted_scores]


def compute_similarity(patient_list):
    global patients_pointer, tanimoto_edges_output, tanimoto_nodes_output, tanimoto_weighted_output, \
        tanimoto_bigrams_output, jaccard_output

    # calculate the similarity and output it to the files
    od = OrderedDict(sorted(patient_list.items()))
    patients_pointer = od

    # create a list of the other patients
    other_patients = copy.deepcopy(patients_pointer)

    # iterate over the patients and compute the similarity
    for keyA, patientA in patients_pointer.iteritems():

        # store the scores of the test
        tanimoto_edges_scores = []
        tanimoto_nodes_scores = []
        tanimoto_bigrams_scores = []

        jaccard_scores = []

        # iterate over all of the other patients
        for keyB, patientB in other_patients.iteritems():

            # Find all of the common edges between patient A and patient B
            common_list = sorted(list(set(patientA.get_all_edges()) | set(patientB.get_all_edges())))

            # Find all of the common node/node pairs between patient A and patient B
            common_combined_nodes = sorted(
                list(set(patientA.get_all_combined_nodes()) | set(patientB.get_all_combined_nodes())))

            bigrams_a = patientA.get_all_combined_nodes_bigrams()
            bigrams_b = patientB.get_all_combined_nodes_bigrams()

            common_nodes_bigrams = sorted( list( set(bigrams_a) | set(bigrams_b) ) )

            # Create the edge vector for each patient
            vector_a_edges = patientA.get_edges_vector(common_list)
            vector_b_edges = patientB.get_edges_vector(common_list)

            #  Create the node vector for each patient
            vector_a_nodes = patientA.get_nodes_vector(common_combined_nodes, False)
            vector_b_nodes = patientB.get_nodes_vector(common_combined_nodes, False)

            vector_a_nodes_bigrams = patientA.get_nodes_vector(common_nodes_bigrams, True)
            vector_b_nodes_bigrams = patientB.get_nodes_vector(common_nodes_bigrams, True)

            # Compute the scores
            tanimoto_nodes = sim.compute_tanimoto_coeff(vector_a_nodes, vector_b_nodes)
            tanimoto_edges = sim.compute_tanimoto_coeff(vector_a_edges, vector_b_edges)
            tanimoto_bigrams = sim.compute_tanimoto_coeff(vector_a_nodes_bigrams, vector_b_nodes_bigrams)

            jaccard = sim.compute_jaccard_coeff(patientA.get_all_unique_nodes(),
                                                patientB.get_all_unique_nodes())

            # Save the scores to their respective arrays
            tanimoto_edges_scores.append(tanimoto_edges)
            tanimoto_nodes_scores.append(tanimoto_nodes)
            tanimoto_bigrams_scores.append(tanimoto_bigrams)
            jaccard_scores.append(jaccard)

        # Find the maximum score (necessary because there may be no edges )
        max_edge_score = max(tanimoto_edges_scores)
        if max_edge_score == 0:
            tanimoto_edges_scores = [0 for i in tanimoto_edges_scores]
        else:
            tanimoto_edges_scores = [float(i) / max(tanimoto_edges_scores) for i in tanimoto_edges_scores]

        # Normalize all of the scores (tanimoto nodes, jaccard, and weighted tanimoto)
        tanimoto_nodes_scores = [float(i) / max(tanimoto_nodes_scores) for i in tanimoto_nodes_scores]
        tanimoto_bigrams_scores = [float(i) / max(tanimoto_bigrams_scores) for i in tanimoto_bigrams_scores]
        jaccard_scores = [float(i) / max(jaccard_scores) for i in jaccard_scores]
        tanimoto = [tanimoto_edges_scores[i] * 0.5 + tanimoto_nodes_scores[i] * 0.5 for i in
                    range(len(tanimoto_edges_scores))]

        tanimoto_edges_output[keyA] = sort_by_scores(tanimoto_edges_scores, other_patients)
        tanimoto_nodes_output[keyA] = sort_by_scores(tanimoto_nodes_scores, other_patients)
        tanimoto_bigrams_output[keyA] = sort_by_scores(tanimoto_bigrams_scores, other_patients)

        tanimoto_weighted_output[keyA] = sort_by_scores(tanimoto, other_patients)
        jaccard_output[keyA] = sort_by_scores(jaccard_scores, other_patients)


def set_graph_node(cg, infected, score):
    # set the level
    cg.set_node_value(infected[1:])
    # add the full node name to keep track
    cg.set_node_position(infected)
    # the score is based on whether we had to split the node or not
    cg.set_value_at(infected[1:], infected[1:], score)


def parse_input_data(m_reader):
    m_result = {}
    for row in m_reader:
        key = row.pop('Dummy ID')
        if key in m_result:
            pass
        parsed = {}
        for attr in row:
            id = attr.split('(')[0].replace(" ", "_")
            if id[-1] == '_':
                id = id[:-1]
            parsed[id] = row[attr]
        if key.isdigit():
            m_result[int(key)] = parsed
    return m_result


def parse_patient_nodes(m_nodes):
    # strip out the white space string
    stripped_nodes = [x.strip(" ").replace('L RPLN', 'LRP') for x in m_nodes]
    stripped_nodes = [x.strip(" ").replace('R RPLN', 'RRP') for x in stripped_nodes]

    stripped_nodes = list(set(stripped_nodes))

    m_parsed_nodes = [x.strip(" ").replace('2/3', '23') for x in stripped_nodes]
    m_parsed_nodes = [x.strip(" ").replace('3/4', '34') for x in m_parsed_nodes]
    m_parsed_nodes = [x.strip(" ").replace('2/3/4', '234') for x in m_parsed_nodes]

    return m_parsed_nodes


def parse_tumor_position(m_tumor_position):
    if m_tumor_position.lower() == 'l':
        m_tumor_position = "Left"
    elif m_tumor_position.lower() == 'r':
        m_tumor_position = "Right"
    elif m_tumor_position.lower() == 'bilateral':
        m_tumor_position = "BiLat."
    elif m_tumor_position.lower() == "midline":
        m_tumor_position = "Midline"
    return m_tumor_position


def parse_graph_nodes(m_id, m_parsed_nodes):
    # add the nodes to the graph
    m_tween = 0
    for node in m_parsed_nodes:
        if len(node) > 5:
            continue

        new_nodes = [node]
        current_graph = left

        if node[0] == 'R':
            current_graph = right

        # if the node is 2 and no sub node, then we add both a and b
        if len(node[1:]) == 1 and (node[1:] == "2"):
            new_nodes = [node + 'A', node + 'B']

        # add the nodes to the graph
        for n in new_nodes:
            semantic = n[0]
            if n[1:] == "23" or n[1:] == "234" or n[1:] == "34":
                m_tween = 1
                for c in n[1:]:
                    if c == "2":
                        set_graph_node(current_graph, semantic + "2A", 0.125)
                        set_graph_node(current_graph, semantic + "2B", 0.125)
                    else:
                        set_graph_node(current_graph, semantic + c, 0.25)
            else:
                if n[1:].lower() == "rp":
                    set_graph_node(current_graph, n, -3.0)
                else:
                    set_graph_node(current_graph, n, 1.0)
    return m_tween


# Driver starts here
if __name__ == "__main__":
    data = sys.argv[1]
    connectivity = sys.argv[2]
    version = sys.argv[3]

    patient_attr = {}
    result = {}

    patients_w_dupes = []
    # iterate over the rows of the csv file
    valid_ids = []

    node_column_name = 'Affected_Lymph_node_' + str(version)
    tumor_column_name = 'Tm_Laterality'

    # read in the adjacency matrix
    read_matrix_data(connectivity)

    with open(data, 'r') as csvFile:
        # create the csv reader
        reader = csv.DictReader(csvFile, delimiter='\t')
        # parse the rows
        result = parse_input_data(reader)

    # Parse the input data
    for id in result:
        id = str(id)
        # no id given, we can't use
        if len(id) == 0:
            continue

        parsed = {}

        # get the patient number and create the patient object
        patient_id = int(id)
        patient = Patient(patient_id)

        # add the possible lymph nodes to the patient
        patient.set_lymph_nodes(lymph_nodes)
        patient.set_adjacency_matrix(adjacency_matrix)

        # parse the nodes from the row
        nodes = result[int(id)][node_column_name].split(',')

        # No infected nodes available
        if 'N/A' in nodes or len(nodes[0]) == 0:
            continue

        # parse the nodes
        parsed_nodes = parse_patient_nodes(nodes)
        # get the longest item (test purposes)
        longest_item = max(parsed_nodes, key=len)

        # get and set the patient gender
        gender = str(result[int(id)]["Gender"]).lower()
        patient.set_gender(gender)

        # get and set the tumor position
        tumor_position = parse_tumor_position(result[int(id)][tumor_column_name].strip(" "))
        patient.set_tumor_position(tumor_position)

        # create the graph for the left and right lymph nodes
        left = Graph(lymph_nodes, lymph_nodes)
        right = Graph(lymph_nodes, lymph_nodes)

        # add the nodes to the graph
        tween = parse_graph_nodes(id, parsed_nodes)
        #
        if tween:
            continue

        # set the max number of nodes
        right_nodes = right.get_nodes()
        left_nodes = left.get_nodes()

        # recompute the max nodes
        max_nodes = max(max_nodes, len(right_nodes) + len(left_nodes))

        # set the patient graphs
        if tween == 0:
            patient.set_graphs(left, right, 1.0)
        else:
            patient.set_output_nodes(parsed_nodes)
            patient.set_graphs(left, right, 0.25)

        # add the graphs to the non-rp dictionary
        if "rp" not in (right_nodes + left_nodes):
            non_rp_patients.update({patient_id: patient})
            non_rp_ids.append(patient_id)
        else:
            rp_patients.update({patient_id: patient})
            rp_ids.append(patient_id)

        # keep the rest of the parsed attributes
        patient_attr[id] = result[int(id)]

    all_patients = rp_patients.copy()
    all_patients.update(non_rp_patients)

    # Computer the similarity
    compute_similarity(all_patients)

    file_name = ''
    scores_out = []

    ids = all_patients
    header = ",".join(str("Patient " + str(x)) for x in sorted(ids))
    for output in ['weighted', 'bigrams', 'nodes']:
        if output == "edges":
            init_matrix_file(header)
            file_name = 'data/json/tanimoto_edges.json'
            f = open(file_name, 'w')
            scores_out = tanimoto_edges_output
        elif output == "nodes":
            init_matrix_file(header)
            file_name = 'data/json/tanimoto_nodes.json'
            f = open(file_name, 'w')
            scores_out = tanimoto_nodes_output
        elif output == "weighted":
            init_matrix_file(header)
            file_name = 'data/json/tanimoto_weighted.json'
            f = open(file_name, 'w')
            scores_out = tanimoto_weighted_output
        elif output == "bigram":
            init_matrix_file(header)
            file_name = 'data/json/tanimoto_bigrams.json'
            f = open(file_name, 'w')
            scores_out = tanimoto_bigrams_output
        elif output == "jaccard":
            init_matrix_file(header)
            file_name = 'data/json/jaccard.json'
            f = open(file_name, 'w')
            scores_out = jaccard_output

        f.write('[\n')

        # write the results to the csv and json files
        write_patient_data(scores_out)

        # write the ending of the json file
        f.write(']')

        f.close()
        m.close()

        # write the final CSV
        write_to_scores(file_name, header)