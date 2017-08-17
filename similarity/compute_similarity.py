import sys, csv, copy
from Graph import Graph
from Patient import Patient
import Similarity as sim

# A list of all the patients that are read in
patients = {}
patient_attr = {}
lymph_nodes = []
adjacency_matrix = []

output = ""

# output file
f = None


def write_to_file(current_patient, patient_order, scores):
    # write the output
    f.write('{ "id": ' + str(current_patient.get_id()) + ', "gender": "' + current_patient.get_gender() + '", ')
    f.write('"position": "' + current_patient.get_tumor_position() + '", ')

    for attr in patient_attr[str(current_patient.get_id())]:
        val = patient_attr[str(current_patient.get_id())][attr]
        f.write('"' + attr + '": "' + val + '", ')

    output = ",".join(str(e) for e in patient_order)
    f.write('"similarity": [' + output + '], ')

    output = ",".join(str(e) for e in scores)
    f.write('"scores": [' + output + '], ')

    out_nodes = current_patient.get_graph("Left").get_node_positions() + current_patient.get_graph("Right").get_node_positions()
    output = '","'.join(str(n).upper() for n in out_nodes)
    f.write('"nodes": ["' + output + '"] }')

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
    min_nodes = min( len(patient_a.get_all_nodes()), len(patient_b.get_all_nodes()) )
    max_nodes = min( len(patient_a.get_all_nodes()), len(patient_b.get_all_nodes()) )

    return [min_nodes, max_nodes]


def get_min_max_edges(patient_a, patient_b):
    min_nodes = min( len(patient_a.get_all_edges()), len(patient_b.get_all_edges()) )
    max_nodes = min( len(patient_a.get_all_edges()), len(patient_b.get_all_edges()) )

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

    global output
    scores = []

    # small function to sort the patients by their scores
    def getScore(idx):
        i = patients.keys().index(idx)
        # we want the first element to stay the same
        return scores[i]

    # iterate over the graphs and compute the similarity
    for keyA, patientA in patients.iteritems():

        # store the scores of the test
        tanimoto_edges_scores = []
        tanimoto_nodes_scores = []
        jaccard_scores = []

        # create a list of the other patients
        other_patients = copy.deepcopy(patients)

        for keyB, patientB in other_patients.iteritems():

            # patient is most similar to his/her self
            # if keyB == keyA:
            #     scores.append(0.0)
            #     patient_idx = idx
            #     continue

            common_list = sorted(list(set(patientA.get_all_edges()) | set(patientB.get_all_edges())))

            vector_a_edges = patientA.get_edges_vector(common_list)
            vector_b_edges = patientB.get_edges_vector(common_list)

            vector_a_nodes = patientA.get_nodes_vector()
            vector_b_nodes = patientB.get_nodes_vector()

            tanimoto_edges = sim.compute_tanimoto_coeff(vector_a_edges, vector_b_edges)
            tanimoto_nodes = sim.compute_tanimoto_coeff(vector_a_nodes, vector_b_nodes)

            jaccard = sim.compute_jaccard_coeff(patientA.get_all_unique_edges(),
                                                patientB.get_all_unique_edges())

            tanimoto_edges_scores.append(tanimoto_edges)
            tanimoto_nodes_scores.append(tanimoto_nodes)
            jaccard_scores.append(jaccard)

        tanimoto_edges_scores = [float(i) / max(tanimoto_edges_scores) for i in tanimoto_edges_scores]
        tanimoto_nodes_scores = [float(i) / max(tanimoto_nodes_scores) for i in tanimoto_nodes_scores]
        jaccard_scores        = [float(i) / max(jaccard_scores) for i in jaccard_scores]

        tanimoto = [ tanimoto_edges_scores[i] * 0.5 + tanimoto_nodes_scores[i] * 0.5 for i in range(len(tanimoto_edges_scores)) ]

        sorted_scores = []
        sorted_by_score = []
        # sort the patients by their scores
        # noinspection PyInterpreter
        if output == "edges":
            scores = tanimoto_edges_scores
            sorted_by_score = sorted(other_patients, key=getScore, reverse=True)
            sorted_scores = sorted(tanimoto_edges_scores, reverse=True)
        elif output == "nodes":
            scores = tanimoto_nodes_scores
            sorted_by_score = sorted(other_patients, key=getScore, reverse=True)
            sorted_scores = sorted(tanimoto_nodes_scores, reverse=True)
        elif output == "weighted":
            scores = tanimoto
            sorted_by_score = sorted(other_patients, key=getScore, reverse=True)
            sorted_scores = sorted(tanimoto, reverse=True)
        elif output == "jaccard":
            scores = jaccard_scores
            sorted_by_score = sorted(other_patients, key=getScore, reverse=True)
            sorted_scores = sorted(jaccard_scores, reverse=True)

        # write the results to the file
        write_to_file(patientA, sorted_by_score, sorted_scores)

# Driver starts here
if __name__ == "__main__":

    data = sys.argv[1]
    connectivity = sys.argv[2]
    
    patient_attr = {}
    result = {}
    all_patients = {}
    patients = {}
    
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
            result[key] = parsed

        # iterate over the rows of the csv file
        for id in result:
            parsed = {}

            # get the patient number and create the patient object
            patient_id = int(id)
            patient = Patient(patient_id)

            # add the possible lymph nodes to the patient
            patient.set_lymph_nodes(lymph_nodes)
            patient.set_adjacency_matrix(adjacency_matrix)

            # parse the nodes from the row
            nodes = result[id]['Affected_lymph_nodes'].split(',')

            # strip out the white space from eanode[1:], node[1:]ch string
            # I am also replacing rpln with a 7 to fit our previous model
            parsed_nodes = [x.strip(" ").replace(' RPLN', '7') for x in nodes]

            # get the longest item (test purposes)
            longest_item = max(parsed_nodes, key=len)

            del result[id]['Affected_lymph_nodes']

            # get and set the patient gender
            gender = str(result[id]["Gender"]).lower()
            patient.set_gender(gender)
            del result[id]['Gender']

            # get and set the tumor position
            tumor_position = result[id]["Tumor_Laterality"].strip(" ")
            #print tumor_position
            if len(tumor_position) > 1 or len(tumor_position) == 0:
                tumor_position = 'N/A'
            elif tumor_position.lower() == 'l':
                tumor_position = "Left"
            elif tumor_position.lower() == 'r':
                tumor_position = "Right"

            del result[id]['Tumor_Laterality']
            patient.set_tumor_position(tumor_position)

            # until cleaned, I am only working with single coded lymph nodes
            if len(longest_item) > 3:
                continue

            # create the graph for the left and right lymph nodes
            left = Graph(lymph_nodes, lymph_nodes)
            right = Graph(lymph_nodes, lymph_nodes)

            # add the nodes to the graph
            for node in parsed_nodes:

                new_nodes = [node]
                current_graph = left

                if node[0] == 'R':
                    current_graph = right

                # if the node is 5, then we add both a and b
                if node[1:] == "5" or node[1:] == "1":
                    new_nodes = []
                    new_nodes = [node + 'A', node + 'B']

                # add the nodes to the graph
                for n in new_nodes:
                    current_graph.set_node_value(n[1:])
                    # the score is based on whether we had to split the node or not
                    current_graph.set_value_at(n[1:], n[1:], 1.0)
                    current_graph.set_node_position(n)

            # set the patient graphs
            patient.set_graphs(left, right)
            # add the graphs to the dictionary
            patients.update({patient_id: patient})

            # keep the rest of the parsed attributes
            del result[id]["Comments"]
            patient_attr[id] = result[id]
    
    # calculate the similarity and output it to the files 
    for output in ['nodes', 'edges', 'weighted', 'jaccard']:

        print output

        if output == "edges":
            f = open('./data/json/tanimoto_edges.json', 'w')
        elif output == "nodes":
            f = open('./data/json/tanimoto_nodes.json', 'w')
        elif output == "weighted":
            f = open('./data/json/tanimoto_weighted.json', 'w')
        elif output == "jaccard":
            f = open('./data/json/jaccard.json', 'w')
        f.write('[\n')

        # computer the similarity of the constructed graphs
        compute_similarity()

        # write the ending of the json file
        f.write(']')
        f.close()
