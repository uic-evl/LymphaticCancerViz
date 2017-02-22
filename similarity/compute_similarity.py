import sys, csv, copy
from Graph import Graph
from Patient import Patient

# the index corresponding to the list of affected nodes
node_index = 13
gender_index = 2
tumor_index = 7

# store all of the graphs in a list
patients = {}

lymph_nodes = ["1a", "1b", "2", "3", "4", "5a", "5b", "6", "7"]

tumors = []

genders = []

# output file
f = None


def write_to_file(current_patient, scores):
    # write the output
    f.write('{ "id": ' + str(current_patient.get_id()) + ', "gender": "' + current_patient.get_gender() + '", ')
    f.write('"position": "' + current_patient.get_tumor_position() + '", ')
    output = ",".join(str(e) for e in scores)
    f.write('"similarity": [' + output + '], ')
    output = ",".join(str(e) for e in scores)
    f.write('"scores": [' + output + '], ')
    output = '","'.join(str(e).upper() for e in current_patient.get_graph("Left").get_node_positions())
    f.write('"nodes": ["' + output + '"] }')

    # check for end of data
    if current_patient.get_id() == patients.keys()[-1]:
        f.write("\n")
    else:
        f.write(",\n")


def get_patient_graphs(current_patient):

    # get the left graph of current_patient A
    graphA_left = current_patient.get_graph("Left")
    graphA_right = current_patient.get_graph("Right")

    # if one of the graphs is devoid of infected nodes, only look at one
    if len(graphA_left.get_nodes()) == 0:
        return graphA_right
    elif len(graphA_right.get_nodes()) == 0:
        return graphA_left
    # both have infected nodes on each side of the head
    else:
        return [graphA_left, graphA_right]


def compute_neighbors_similarity(graph_a, graph_b):
    # get the nodes in graph A and graph B
    aNodes = graph_a.get_nodes()
    bNodes = graph_b.get_nodes()

    # create a new graph that is the size of A x B
    neighbors = Graph(aNodes, bNodes)

    for node in aNodes:
        if node in bNodes:
            # get the two weights of the graphs, then average their value
            # will not always be one if a graph has a bilateral node
            neighbor_weight_a = graph_a.get_value_at(node, node)
            neighbor_weight_b = graph_b.get_value_at(node, node)
            new_weight = (neighbor_weight_a / neighbor_weight_b)

            neighbors.set_value_at(node, node, new_weight)

    return neighbors

def compute_graph_similarity(graph_a, graph_b):

    neighbor_similarity_matrix = compute_neighbors_similarity(graph_a, graph_b)
    # neighbor_similarity_matrix.print_matrix()

    aNodes = graph_a.get_nodes()
    bNodes = graph_b.get_nodes()

    # get the min/max number of nodes between the two matrices
    min_nodes = min( aNodes, bNodes)
    max_nodes = max( aNodes, bNodes)

    a_diff_b = len(list(set(aNodes) - set(bNodes)))
    b_diff_a = len(list(set(bNodes) - set(aNodes)))
    total_diff = a_diff_b + b_diff_a

    # store the sum of the neighbor matching weights
    summed_weights = 0

    for i in range( len(neighbor_similarity_matrix.get_rows()) ):
        row = neighbor_similarity_matrix.get_row(i)
        summed_weights = summed_weights + max(row)

    # normalize the weights with the minimum number of nodes
    return summed_weights / ( len(max_nodes) + total_diff )


def compute_similarity():

    # store the scores of the test
    scores = []

    # small function to sort the patients by their scores
    def getScore(idx):
        i = patients.keys().index(idx)
        # print len(scores)
        # we want the first element to stay the same
        return scores[i]

    # iterate over the graphs and compute the similarity
    for keyA, patientA in patients.iteritems():

        scores = []

        # get the valid graph from the patient
        graphA = get_patient_graphs(patientA)

        # create a list of the other patients
        otherPatients = copy.deepcopy(patients)

        for keyB, patientB in otherPatients.iteritems():
            # patient is most similar to his/her self
            if keyB == keyA:
                scores.append(sys.maxint)
                continue

            # get the valid graph from the patient
            graphB = get_patient_graphs(patientB)

            graph_similarity = 0
            # if both patients only have one side of their head infected
            if not isinstance(graphA, list) and not isinstance(graphB, list):
                # compute the neighbor similarity of the two graphs
                graph_similarity = compute_graph_similarity(graphA, graphB)
            elif isinstance(graphA, list) and not isinstance(graphB, list):
                # take the max score of the two comparisons
                first_score = compute_graph_similarity(graphA[0], graphB)
                second_score = compute_graph_similarity(graphA[1], graphB)
                graph_similarity = max(first_score, second_score)
            elif isinstance(graphB, list) and not isinstance(graphA, list):
                # take the max score of the two comparisons
                first_score = compute_graph_similarity(graphA, graphB[0])
                second_score = compute_graph_similarity(graphA, graphB[1])
                graph_similarity = max(first_score, second_score)
            # both patients have infected nodes on both sides of the head/neck
            # find the best match by comparing
            else:
                # compute the score in relation to the left side of patient A
                left_left = compute_graph_similarity(graphA[0], graphB[0])
                right_right = compute_graph_similarity(graphA[1], graphB[1])

                # compute the score in relation to the right side of patient A
                left_right = compute_graph_similarity(graphA[0], graphB[1])
                right_left = compute_graph_similarity(graphA[1], graphB[0])

                # test if either group is a perfect match
                if left_left == 1.0 and right_right == 1.0:
                    graph_similarity = 2.0
                elif left_right == 1.0 and right_left == 1.0:
                    graph_similarity = 2.0
                # else, take the max of the two scores
                else:
                    graph_similarity = max(left_left+right_right, left_right, right_left) / 2.0

            scores.append(graph_similarity)

        # sort the patients by their scores
        sorted_by_score = sorted(otherPatients, key=getScore, reverse=True)

        # write the results to the file
        write_to_file(patientA, sorted_by_score)


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
            patient_id= int(row[0])
            patient = Patient(patient_id)

            # parse the nodes from the row
            nodes = row[node_index].split(';')
            # strip out the white space from eanode[1:], node[1:]ch string
            # I am also replacing rpln with a 7 to fit our previous model
            parsed_nodes = [x.strip(' ').replace(' RPLN', '7') for x in nodes]

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

                if node[1] == 'R':
                    current_graph = right

                # if the node is 5, then we add both a and b
                if node[1:] == "5" or node[1:] == "1":
                    new_nodes = []
                    new_nodes = [node+'A', node+'B']

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

            # print g.get_nodes()
            # print

    # computer the similarity of the constructed graphs
    compute_similarity()

    # write the ending of the json file
    f.write(']')
    f.close()
