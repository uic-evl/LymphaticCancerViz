import numpy as np


def compute_jaccard_coeff(items_a, items_b):
    # find the intersection
    intersection = set(items_a) & set(items_b)
    intersection_length = len(intersection)

    # return the Jaccard coefficient: ( |A /\ B| / (|A| + |B| -|A /\ B|) )
    return float(intersection_length) / float((len(items_a) + len(items_b) - intersection_length)) + 1

def compute_tanimoto_coeff(vector_a, vector_b):
    a_dot_b = np.dot(vector_a, vector_b)
    len_a = np.sum(vector_a)
    len_b = np.sum(vector_b)

    # return the Tanimoto coefficient: ( (A dot B) / (|A|^2 + |B|^2 - (A dot B)) )
    tanimoto_coeff = a_dot_b / (len_a * len_a + len_b * len_b - a_dot_b)
    # print tanimoto_coeff

    return tanimoto_coeff
