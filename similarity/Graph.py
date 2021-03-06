import numpy as np


class Graph(object):

    def __init__(self, rows, cols):

        # initialize the matrix to all zeros
        self.matrix = np.zeros((len(rows), len(cols)))
        # store the row and column sizes
        self.row_length = len(rows)
        self.col_length = len(cols)

        # store a list of node names to map between indices
        self.rows = rows
        self.cols = cols

        self.nodes = []
        self.positions = []
        self.edges = {}

    def set_value_at(self, i, j, value):

        # get the row and column of the matrix from the values
        row = self.rows.index(i.lower())
        col = self.cols.index(j.lower())

        self.matrix[row][col] = value

    def set_node_value(self, node):
        if node not in self.nodes:
            self.nodes.append(node.lower())

    def set_node_position(self, node):
        if node not in self.nodes:
            self.positions.append(node.lower())

    def get_nodes(self):
        return sorted(self.nodes)

    def set_edge(self, edge_a, edge_b, value):

        index   = str(edge_a) + '_' + str(edge_b)
        reverse = str(edge_b) + '_' + str(edge_a)

        if index in self.edges:
            self.edges[index] += value
        elif reverse in self.edges:
            self.edges[reverse] += value
        else:
            self.edges[index] = value

    def get_edges(self):
        s = {}
        for key in sorted(self.edges.keys()):
            s[key] = self.edges[key]
        return s

    def get_node_positions(self):
        return self.positions

    def get_value_at(self, i, j):
        # get the indices
        row = self.rows.index(i.lower())
        col = self.cols.index(j.lower())

        return self.matrix[row][col]

    def get_rows(self):
        return self.rows

    def get_cols(self):
        return self.cols

    def get_row(self, index):
        return self.matrix[index, :]

    def print_matrix(self):
        print(''.join('{:>4} '.format(x) for x in self.cols))

        for row in self.matrix:
            print(''.join('{:>4} '.format(x) for x in row))
