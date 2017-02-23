import numpy as np
from Graph import Graph

class Patient(object):

    def __init__(self, id):
        self.id = id

        self.left_graph = None
        self.right_graph = None
        self.tumor_position = ""
        self.gender = ""

    def get_id(self):
        return self.id

    def set_graphs(self, leftGraph, rightGraph):
        self.left_graph = leftGraph
        self.right_graph = rightGraph

    def get_graph(self, position):
        if position == "Right":
            return self.right_graph
        elif position == "Left":
            return self.left_graph

    def set_tumor_position(self, tumorPosition):
        self.tumor_position = tumorPosition

    def get_all_nodes(self):
        return self.left_graph.get_node_positions() + self.right_graph.get_node_positions()

    def get_tumor_position(self):
        return self.tumor_position

    def set_gender(self, gender):
        self.gender = gender

    def get_gender(self):
        return self.gender
