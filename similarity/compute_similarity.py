import sys, csv, copy
from collections import OrderedDict
from Graph import Graph
from Patient import Patient
import Similarity as sim

# A list of all the patients that are read in
patients = {}
patient_attr = {}
lymph_nodes = []
adjacency_matrix = []

output = ""
matrix = True
ids = []

# output file
f = None


def write_to_csv(current_patient, patient_order, scores):
    ordered_scores = []
    for id in sorted(ids):
        if id == current_patient.get_id():
            ordered_scores.append("-1.0")
        else:
            idx = patient_order.index(id)
            ordered_scores.append(scores[idx])

    order = ",".join(str(x) for x in ordered_scores)
    f.write("Patient " + str(current_patient.get_id()) + ",")
    f.write(order)
    f.write('\r')

    return


def write_to_file(current_patient, patient_order, scores):
    # write the output
    f.write('{ "id": ' + str(current_patient.get_id()) + ', "gender": "' + current_patient.get_gender() + '", ')
    f.write('"position": "' + current_patient.get_tumor_position() + '", ')

    for col_attr in patient_attr[str(current_patient.get_id())]:
        val = patient_attr[str(current_patient.get_id())][col_attr]
        f.write('"' + col_attr + '": "' + val + '", ')

    output_writer = ",".join(str(e) for e in patient_order)
    # if str(current_patient.get_id() == "1"):
    #     print output_writer[:10]
    f.write('"similarity": [' + output_writer + '], ')

    output_writer = ",".join(str(round(e, 4)) for e in scores)
    f.write('"scores": [' + output_writer + '], ')

    patient_out_nodes = current_patient.get_output_nodes()
    out_nodes = patient_out_nodes if len(patient_out_nodes) > 0 else \
        current_patient.get_graph("Left").get_node_positions() + current_patient.get_graph("Right").get_node_positions()
    output_writer = '","'.join(str(n).upper() for n in out_nodes)
    f.write('"nodes": ["' + output_writer + '"] }')

    # check for end of data
    if current_patient.get_id() == patients.keys()[-1]:
        f.write("\n")
    else:
        f.write(",\n")


def read_matrix_data(file):
    global lymph_nodes
    global adjacency_matrix

    with open(file, 'r') as csvFile:
        # create a csv reader
        reader = csv.reader(csvFile, delimiter=',')
        # iterate over the rows of the csv file
        for row in reader:

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


def get_min_max_nodes(patient_a, patient_b):
    min_nodes = min(len(patient_a.get_all_combined_nodes()), len(patient_b.get_all_combined_nodes()))
    max_nodes = min(len(patient_a.get_all_combined_nodes()), len(patient_b.get_all_combined_nodes()))

    return [min_nodes, max_nodes]


def get_min_max_edges(patient_a, patient_b):
    min_nodes = min(len(patient_a.get_all_edges()), len(patient_b.get_all_edges()))
    max_nodes = min(len(patient_a.get_all_edges()), len(patient_b.get_all_edges()))

    return [min_nodes, max_nodes]


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

    # create a new graph that is the size of A x B
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


def compute_similarity():
    global output, patients
    scores = []

    # create a list of the other patients
    other_patients = copy.deepcopy(patients)

    # small function to sort the patients by their scores
    def get_score(idx):
        ii = other_patients.keys().index(idx)
        # we want the first element to stay the same
        return scores[ii]

    # iterate over the graphs and compute the similarity
    for keyA, patientA in patients.iteritems():

        # store the scores of the test
        tanimoto_edges_scores = []
        tanimoto_nodes_scores = []
        jaccard_scores = []

        for keyB, patientB in other_patients.iteritems():

            common_list = sorted(list(set(patientA.get_all_edges()) | set(patientB.get_all_edges())))

            common_combined_nodes = sorted(
                list(set(patientA.get_all_combined_nodes()) | set(patientB.get_all_combined_nodes())))

            vector_a_edges = patientA.get_edges_vector(common_list)
            vector_b_edges = patientB.get_edges_vector(common_list)

            vector_a_nodes = patientA.get_nodes_vector(common_combined_nodes)
            vector_b_nodes = patientB.get_nodes_vector(common_combined_nodes)

            tanimoto_nodes = sim.compute_tanimoto_coeff(vector_a_nodes, vector_b_nodes)
            tanimoto_edges = sim.compute_tanimoto_coeff(vector_a_edges, vector_b_edges)
            jaccard = sim.compute_jaccard_coeff(patientA.get_all_unique_nodes(),
                                                patientB.get_all_unique_nodes())

            # if patientA.get_id() == 288 and patientB.get_id() == 2003:
            #     print common_combined_nodes
            #     print vector_a_nodes
            #     print vector_b_nodes
            #     print tanimoto_nodes
            #     print tanimoto_edges

            tanimoto_edges_scores.append(tanimoto_edges)
            tanimoto_nodes_scores.append(tanimoto_nodes)
            jaccard_scores.append(jaccard)

        max_edge_score = max(tanimoto_edges_scores)
        if max_edge_score == 0:
            tanimoto_edges_scores = [0 for i in tanimoto_edges_scores]
        else:
            tanimoto_edges_scores = [float(i) / max(tanimoto_edges_scores) for i in tanimoto_edges_scores]

        tanimoto_nodes_scores = [float(i) / max(tanimoto_nodes_scores) for i in tanimoto_nodes_scores]
        jaccard_scores = [float(i) / max(jaccard_scores) for i in jaccard_scores]

        tanimoto = [tanimoto_edges_scores[i] * 0.5 + tanimoto_nodes_scores[i] * 0.5 for i in
                    range(len(tanimoto_edges_scores))]

        sorted_scores = []
        sorted_by_score = []
        # sort the patients by their scores
        # noinspection PyInterpreter
        if output == "edges":
            scores = tanimoto_edges_scores
            sorted_by_score = sorted(other_patients, key=get_score, reverse=True)
            sorted_scores = sorted(tanimoto_edges_scores, reverse=True)
        elif output == "nodes":
            scores = tanimoto_nodes_scores
            sorted_by_score = sorted(other_patients, key=get_score, reverse=True)
            sorted_scores = sorted(tanimoto_nodes_scores, reverse=True)
        elif output == "weighted":
            scores = tanimoto
            sorted_by_score = sorted(other_patients, key=get_score, reverse=True)
            sorted_scores = sorted(tanimoto, reverse=True)
        elif output == "jaccard":
            scores = jaccard_scores
            sorted_by_score = sorted(other_patients, key=get_score, reverse=True)
            sorted_scores = sorted(jaccard_scores, reverse=True)

        # write the results to the file
        if matrix:
            # print patientA.get_id()
            write_to_csv(patientA, sorted_by_score, sorted_scores)
        else:
            write_to_file(patientA, sorted_by_score, sorted_scores)


def set_graph_node(cg, infected, score):
    # set the level
    cg.set_node_value(infected[1:])
    # add the full node name to keep track
    cg.set_node_position(infected)
    # the score is based on whether we had to split the node or not
    cg.set_value_at(infected[1:], infected[1:], score)

# Driver starts here
if __name__ == "__main__":

    data = sys.argv[1]
    connectivity = sys.argv[2]

    patient_attr = {}
    result = {}
    all_patients = {}
    # patients = {}

    node_column_name = 'Affected_Lymph_node_UPPER'
    tumor_column_name = 'Tm_Laterality'

    # read in the adjacency matrix
    read_matrix_data(connectivity)

    with open(data, 'r') as csvFile:
        reader = csv.DictReader(csvFile, delimiter='~')

        for row in reader:
            key = row.pop('Dummy ID')
            if key in result:
                pass
            parsed = {}
            for attr in row:
                id = attr.split('(')[0].replace(" ", "_")
                if id[-1] == '_':
                    id = id[:-1]
                parsed[id] = row[attr]
            if key.isdigit():
                result[int(key)] = parsed

        patients_w_dupes = []
        # iterate over the rows of the csv file
        valid_ids = []
        for id in result:

            id = str(id)

            # if id not in ["288", "2003"]:
            #     continue

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

            ids.append(patient_id)

            # strip out the white space from eanode[1:], node[1:]ch string
            stripped_nodes = [x.strip(" ").replace('L RPLN', 'LRP') for x in nodes]
            stripped_nodes = [x.strip(" ").replace('R RPLN', 'RRP') for x in stripped_nodes]

            stripped_nodes = list(set(stripped_nodes))

            parsed_nodes = [x.strip(" ").replace('2/3', '23') for x in stripped_nodes]
            parsed_nodes = [x.strip(" ").replace('3/4', '34') for x in parsed_nodes]
            parsed_nodes = [x.strip(" ").replace('2/3/4', '234') for x in parsed_nodes]

            # Remove accidental dupes from the data
            # remove_dupes = list(set(parsed_nodes))

            # if len(remove_dupes) < len(parsed_nodes):
            #     patients_w_dupes.append(str(id))

            # parsed_nodes = remove_dupes

            # get the longest item (test purposes)
            longest_item = max(parsed_nodes, key=len)

            # get and set the patient gender
            gender = str(result[int(id)]["Gender"]).lower()
            patient.set_gender(gender)

            # get and set the tumor position
            tumor_position = result[int(id)][tumor_column_name].strip(" ")

            if tumor_position.lower() == 'l':
                tumor_position = "Left"
            elif tumor_position.lower() == 'r':
                tumor_position = "Right"
            elif tumor_position.lower() == 'bilateral':
                tumor_position = "BiLat."
            elif tumor_position.lower() == "Midline":
                tumor_position = "Midline"

            patient.set_tumor_position(tumor_position)

            del result[int(id)][node_column_name]
            # del result[id][tumor_column_name]
            del result[int(id)]['Gender']
            # del result[id]["Comments"]

            # create the graph for the left and right lymph nodes
            left = Graph(lymph_nodes, lymph_nodes)
            right = Graph(lymph_nodes, lymph_nodes)

            # add the nodes to the graph
            tween = 0
            for node in parsed_nodes:
                if len(node) > 5:
                    continue

                new_nodes = [node]
                current_graph = left

                if node[0] == 'R':
                    current_graph = right

                # if the node is 5, then we add both a and b
                if len(node[1:]) == 1 and (node[1:] == "5" or node[1:] == "1" or node[1:] == "2"):
                    new_nodes = []
                    new_nodes = [node + 'A', node + 'B']
                elif node[1:].lower() == "3a":
                    new_nodes = [node[0] + '3']

                # add the nodes to the graph
                for n in new_nodes:
                    semantic = n[0]
                    if n[1:] == "23" or n[1:] == "234" or n[1:] == "34":
                        tween = 1
                        patient.set_output_nodes(new_nodes)
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

            # set the patient graphs
            if tween == 0:
                patient.set_graphs(left, right, 1.0)
            else:
                patient.set_graphs(left, right, 0.125)

            # add the graphs to the dictionary
            patients.update({patient_id: patient})

            # keep the rest of the parsed attributes
            patient_attr[id] = result[int(id)]

    # calculate the similarity and output it to the files

    od = OrderedDict(sorted(patients.items()))
    patients = od
    for output in ['jaccard', 'nodes', 'weighted']:
    # for output in ['weighted']:
        if matrix:
            f = open('data/' + output + '_' + 'matrix.csv', 'w')
            header = ",".join(str("Patient " + str(x)) for x in sorted(ids))
            f.write(",")
            f.write(header)
            f.write('\r')
        elif output == "edges":
            f = open('data/json/tanimoto_edges.json', 'w')
        elif output == "nodes":
            f = open('data/json/tanimoto_nodes.json', 'w')
        elif output == "weighted":
            f = open('data/json/tanimoto_weighted.json', 'w')
        elif output == "jaccard":
            f = open('data/json/jaccard.json', 'w')

        if not matrix:
            f.write('[\n')

        # computer the similarity of the constructed graphs
        compute_similarity()

        # write the ending of the json file
        if not matrix:
            f.write(']')

        f.close()
