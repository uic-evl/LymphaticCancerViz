import sys, csv, numpy as np
from Graph import Graph

# the index corresponding to the list of affected nodes
node_index = 12

# store all of the graphs in a list
graphs = []

def compute_similarity(graph_a, graph_b):
    a = Graph(len(graph_a), len(graph_b))

# Driver starts here
if __name__ == "__main__":
    infile = sys.argv[1]
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

            # until cleaned, I am only working with single coded lymph nodes
            if len(longest_item) > 3:
                continue

            print parsed_nodes

            # create the graph
            g = Graph(9, 9)
            # add the nodes to the graph
            for node in parsed_nodes:
                g.set_value_at(node, node, 1)

            g.print_matrix()

            break

