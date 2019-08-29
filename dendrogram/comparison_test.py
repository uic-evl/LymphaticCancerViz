from matplotlib import pyplot as plt
import pylab
from scipy.cluster import hierarchy
from scipy.cluster.hierarchy import dendrogram, linkage
import json
import numpy as np
import sys
import pandas as pd
import tanglegram as tg

sp_similarity_matrix_file = sys.argv[1]
sp_similarity_matrix = pd.read_csv(sp_similarity_matrix_file, index_col=False, usecols=list(range(1,583)))

nsp_similarity_matrix_file = sys.argv[2]
nsp_similarity_matrix = pd.read_csv(sp_similarity_matrix_file, index_col=False, usecols=list(range(1,583)))

fig = tg.gen_tangle(sp_similarity_matrix, nsp_similarity_matrix, optimize_order=False)
# plt.show()
fig.savefig('comparison.png')
