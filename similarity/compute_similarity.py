import sys, csv, copy
from Graph import Graph
from Patient import Patient
import Similarity as sim

# the index corresponding to the list of affected nodes
node_index = 13
gender_index = 2
tumor_index = 7

# A list of all the patients that are read in
patients = {}
lymph_nodes = ["1a", "1b", "2", "3", "4", "5a", "5b", "6", "7"]

# output file
f = None


def write_to_file(current_patient, patient_order, scores):
    # write the output
    f.write('{ "id": ' + str(current_patient.get_id()) + ', "gender": "' + current_patient.get_gender() + '", ')
    f.write('"position": "' + current_patient.get_tumor_position() + '", ')

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
    # store the scores of the test
    scores = []

    # small function to sort the patients by their scores
    def getScore(idx):
        i = patients.keys().index(idx)
        # we want the first element to stay the same
        return scores[i]

    # iterate over the graphs and compute the similarity
    for keyA, patientA in patients.iteritems():

        scores = []

        # get the valid graph from the patient
        graph_a = get_patient_graphs(patientA)

        # create a list of the other patients
        other_patients = copy.deepcopy(patients)

        for keyB, patientB in other_patients.iteritems():
            # patient is most similar to his/her self
            if keyB == keyA:
                scores.append(sys.maxint)
                continue

            # get the valid graph from the patient
            graph_b = get_patient_graphs(patientB)

            jaccard = 0
            graph_similarity = 0

            vector_a = patientA.get_vector()
            vector_b = patientB.get_vector()

            graph_similarity = sim.compute_tanimoto_coeff(vector_a, vector_b)
            scores.append(graph_similarity)

            # # if both patients only have one side of their head infected
            # if not isinstance(graph_a, list) and not isinstance(graph_b, list):
            #     # compute the neighbor similarity of the two graphs
            #     graph_similarity = compute_graph_similarity(graph_a, graph_b)
            #     jaccard = sim.compute_jaccard_coeff(graph_a.get_nodes(), graph_b.get_nodes())
            #
            # elif not isinstance(graph_a, list) and isinstance(graph_b, list):
            #     # take the max score of the two comparisons
            #     first_score = compute_graph_similarity(graph_a, graph_b[0])
            #     second_score = compute_graph_similarity(graph_a, graph_b[1])
            #
            #     graph_similarity = max(first_score, second_score)
            #
            #     if graph_similarity == first_score:
            #         jaccard = sim.compute_jaccard_coeff(graph_a.get_nodes(), graph_b[0].get_nodes())
            #     else:
            #         jaccard = sim.compute_jaccard_coeff(graph_a.get_nodes(), graph_b[1].get_nodes())
            #
            # elif isinstance(graph_a, list) and not isinstance(graph_b, list):
            #     # take the max score of the two comparisons
            #     first_score = compute_graph_similarity(graph_a[0], graph_b)
            #     second_score = compute_graph_similarity(graph_a[1], graph_b)
            #
            #     min_nodes, max_nodes = get_min_max_nodes(patientA, patientB)
            #     graph_similarity = max(first_score, second_score)
            #
            #     if graph_similarity == first_score:
            #         jaccard = sim.compute_jaccard_coeff(graph_a[0].get_nodes(), graph_b.get_nodes())
            #
            #         difference = len(set(graph_a[0].get_nodes()) ^ set(graph_b.get_nodes()))
            #         graph_similarity /= (difference+1.0)
            #     else:
            #         jaccard = sim.compute_jaccard_coeff(graph_a[1].get_nodes(), graph_b.get_nodes())
            #         difference = len(set(graph_a[1].get_nodes()) ^ set(graph_b.get_nodes()))
            #         graph_similarity /= (difference+1.0)
            #
            # else:
            #     # compute the score in relation to the left side of patient A
            #     left_left = compute_graph_similarity(graph_a[0], graph_b[0])
            #     right_right = compute_graph_similarity(graph_a[1], graph_b[1])
            #
            #     # compute the score in relation to the right side of patient A
            #     left_right = compute_graph_similarity(graph_a[0], graph_b[1])
            #     right_left = compute_graph_similarity(graph_a[1], graph_b[0])
            #
            #     left_score = left_left + right_right
            #     right_score = left_right + right_left
            #
            #     min_nodes, max_nodes = get_min_max_nodes(patientA, patientB)
            #     graph_similarity = max(left_score, right_score)
            #
            #     if graph_similarity == left_score:
            #
            #         difference = len(set(graph_a[0].get_nodes()) ^ set(graph_b[0].get_nodes()))
            #         difference += len(set(graph_a[1].get_nodes()) ^ set(graph_b[1].get_nodes()))
            #         graph_similarity /= (difference+1.0)
            #
            #         jaccard = sim.compute_jaccard_coeff(graph_a[0].get_nodes(), graph_b[0].get_nodes())
            #         jaccard += sim.compute_jaccard_coeff(graph_a[1].get_nodes(), graph_b[1].get_nodes())
            #     else:
            #
            #         difference = len(set(graph_a[0].get_nodes()) ^ set(graph_b[1].get_nodes()))
            #         difference += len(set(graph_a[1].get_nodes()) ^ set(graph_b[0].get_nodes()))
            #         graph_similarity /= (difference+1.0)
            #
            #         jaccard = sim.compute_jaccard_coeff(graph_a[1].get_nodes(), graph_b[0].get_nodes())
            #         jaccard += sim.compute_jaccard_coeff(graph_a[0].get_nodes(), graph_b[1].get_nodes())
            #
            # # normalize the score with the jaccard distance
            # graph_similarity *= jaccard
            #
            # scores.append(graph_similarity)

        # sort the patients by their scores
        sorted_by_score = sorted(other_patients, key=getScore, reverse=True)
        sorted_scores = sorted(scores, reverse=False)

        # write the results to the file
        write_to_file(patientA, sorted_by_score, sorted_scores)


# Driver starts here
if __name__ == "__main__":
    infile = sys.argv[1]
    f = open('data/data.json', 'w')
    f.write('[\n')
    with open(infile, 'r') as csvFile:
        # create a csv reader
        reader = csv.reader(csvFile, delimiter=',')
        # iterate over the rows of the csv file
        for row in reader:
            # header row and blank lines
            if not row[0].isdigit():
                continue

            # get the patient number and create the patient object
            patient_id = int(row[0])
            patient = Patient(patient_id)

            # add the possible lymph nodes to the patient
            patient.set_lymph_nodes(lymph_nodes)

            # parse the nodes from the row
            nodes = row[node_index].split(';')
            # strip out the white space from eanode[1:], node[1:]ch string
            # I am also replacing rpln with a 7 to fit our previous model
            parsed_nodes = [x.strip(" ").replace(' RPLN', '7') for x in nodes]

            # get the longest item (test purposes)
            longest_item = max(parsed_nodes, key=len)

            # get and set the patient gender
            gender = str(row[gender_index]).lower()
            patient.set_gender(gender)

            # get and set the tumor position
            tumor_position = row[tumor_index]
            if len(tumor_position) > 1 or len(tumor_position) == 0:
                tumor_position = 'N/A'
            elif tumor_position.lower() == 'l':
                tumor_position = "Left"
            elif tumor_position.lower() == 'r':
                tumor_position = "Right"
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
                    current_graph.set_value_at(n[1:], n[1:], 1.0 / len(new_nodes))
                    current_graph.set_node_position(n)

            # set the patient graphs
            patient.set_graphs(left, right)
            # add the graphs to the dictionary
            patients.update({patient_id: patient})

    # computer the similarity of the constructed graphs
    compute_similarity()

    # write the ending of the json file
    f.write(']')
    f.close()
