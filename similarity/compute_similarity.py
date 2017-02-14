import sys, csv, copy
from Graph import Graph

# the index corresponding to the list of affected nodes
node_index = 12

# store all of the graphs in a list
graphs = {}

lymph_nodes = ["1a", "1b", "2", "3", "4", "5", "6", "7"]

tumors = []

# output file
f = None

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
    def getScore(index):
        # we want the first element to stay the same
        return scores[index-1]

    # iterate over the graphs and compute the similarity
    for keyA, graphA in graphs.iteritems():
        scores = []
        # create a list of the other patients
        otherGraphs = copy.deepcopy(graphs)
        #del otherGraphs[keyA]

        for keyB, graphB in otherGraphs.iteritems():
            if keyB == keyA:
                scores.append(sys.maxint)
                continue
            # compute the neighbor similarity of the two graphs
            graph_similarity = compute_graph_similarity(graphA, graphB)
            scores.append(graph_similarity)

        # sort the patients by their scores
        sorted_by_score = sorted(otherGraphs, key=getScore, reverse=True)

        # write the output
        f.write( '{ "id": ' + str(keyA) + ', "position": "' + tumors[int(keyA)-1] + '", '  )
        list = ",".join(str(e) for e in sorted_by_score)
        f.write('"similarity": [' + list + '], ' )
        list = ",".join(str(e) for e in scores)
        f.write('"scores": [' + list + '], ')
        list = '","'.join(str(e) for e in graphA.get_nodes())
        f.write('"nodes": ["' + list + '"] }')

        # check for end of data
        if int(keyA) == len(graphs):
            f.write("\n")
        else:
            f.write(",\n")

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

            # parse the nodes from the row
            nodes = row[node_index].split(';')
            # strip out the white space from each string
            # I am also replacing rpln with a 7 to fit our previous model
            parsed_nodes = [x.strip(' ').replace(' RPLN', '7') for x in nodes]

            # get the longest item (test purposes)
            longest_item = max(parsed_nodes, key=len)

            # get the patient number
            patient = int(row[0])

            tumor_position = row[6]
            if len(tumor_position) > 1 or len(tumor_position) == 0:
                tumors.append('N/A')
            elif tumor_position.lower() == 'l':
                tumors.append("Left")
            elif tumor_position.lower() == 'r':
                tumors.append("Right")

            # until cleaned, I am only working with single coded lymph nodes
            if len(longest_item) > 3:
                continue

            # create the graph
            g = Graph(lymph_nodes, lymph_nodes)
            # add the nodes to the graph
            for node in parsed_nodes:
                g.set_node_value(node[1:])
                g.set_value_at(node[1:], node[1:], 1)

            graphs.update({patient:g})

            # print g.get_nodes()
            # print

            if patient == 12:
                break

    # computer the similarity of the constructed graphs
    compute_similarity()
    f.write(']')
    f.close()
