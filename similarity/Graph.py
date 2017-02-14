import numpy as np


class Graph(object):

    def __init__(self, size_a, size_b):

        # initialize the matrix to all zeros
        self.matrix = np.zeros((size_a, size_b))
        # store the row and column sizes
        self.row_length = size_a
        self.col_length = size_b

        # store a list of node names to map between indices
        self.map = ["1a", "1b", "2", "3", "4", "5a", "5b", "6", "7"]

    def set_value_at(self, i, j, value):
        # get the row and column of the matrix from the values
        row = self.map.index(i[1:].lower())
        col = self.map.index(j[1:].lower())

        self.matrix[row][col] = value

    def get_value_at(self, i, j):
        return self.matrix[i][j]

    def print_matrix(self):
        print '{:>4} {:>4} {:>4} {:>4} {:>4} {:>4} {:>4} {:>4} {:>4}'\
                .format(self.map[0], self.map[1], self.map[2], self.map[3], self.map[4], self.map[5], self.map[6],
                        self.map[7], self.map[8])

        for row in self.matrix:
            line = '{:>4} {:>4} {:>4} {:>4} {:>4} {:>4} {:>4} {:>4} {:>4}'\
                .format(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8])
            #print '  '.join('%s' % int(i) for i in row)
            print line
