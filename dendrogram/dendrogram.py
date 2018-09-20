from matplotlib import pyplot as plt
from scipy.cluster.hierarchy import dendrogram, linkage
import numpy as np
import sys
import pandas as pd

#https://joernhees.de/blog/2015/08/26/scipy-hierarchical-clustering-and-dendrogram-tutorial/

similarity_matrix_file = sys.argv[1]


similarity_matrix = pd.read_csv(similarity_matrix_file, index_col=False, usecols=range(1,584))

Z = linkage(similarity_matrix, 'weighted')

