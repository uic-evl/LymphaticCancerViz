from matplotlib import pyplot as plt
import pylab
from scipy.cluster import hierarchy
from scipy.cluster.hierarchy import dendrogram, linkage
import json
import numpy as np
import sys
import pandas as pd

def get_children(root):
    global names
    fringe = [dict( node=root )]
    current = fringe.pop()
    children = []

    while current and current['node']:
        node = current['node']

        if node.left:
            fringe.append(dict( node=node.left ))

        if node.right:
            fringe.append(dict( node=node.right ))

        if not node.left and not node.right:
            name = names[node.id].split(" ")[1]
            children.append(name)

        if len(fringe):
            current = fringe.pop()
        else:
            current = None

    return children

#https://joernhees.de/blog/2015/08/26/scipy-hierarchical-clustering-and-dendrogram-tutorial/
# Create a nested dictionary from the ClusterNode's returned by SciPy
def add_node(node, parent):
    global leaves, names
    # First create the new node and append it to its parent's children
    newNode = dict( node_id=node.id, children=[], count=node.count, dist=node.dist, cluster=[] )
    parent["children"].append( newNode )

    # Recursively add the current node's children if the node is not a leaf
    if node.dist > 0:
        if node.left: add_node( node.left, newNode )
        if node.right: add_node( node.right, newNode )

    else:
        left_children = get_children(node.left)
        right_children = get_children(node.right)

        if len(left_children) == 0 and len(right_children) == 0:
           left_children.append(names[node.id].split(" ")[1])

        newNode['cluster'] = left_children + right_children
        newNode['cluster'].sort(key=int)

# Label each node with the names of each leaf in its subtree
def label_tree( n ):
    # If the node is a leaf, then we have its name
    if len(n["children"]) == 0:
        leafNames = [ id2name[n["node_id"]] ]

    # If not, flatten all the leaves in the node's subtree
    else:
        leafNames = reduce(lambda ls, c: ls + label_tree(c), n["children"], [])

    # Delete the node id since we don't need it anymore and
    # it makes for cleaner JSON
    del n["node_id"]

    # Labeling convention: "-"-separated leaf names
    n["name"] = name = "-".join(sorted(map(str, leafNames)))

    return leafNames


def iterativeInOrder(root):
    stack = []
    current = root

    while len(stack) > 0 or current:
        if current:
            stack.append(current)
            current = current["children"][0] if len(current["children"]) else None
        else:
            current = stack.pop()
            # do something
            print current["node_id"]
            current = current["children"][1] if len(current["children"]) > 1 else None


def postOrder(root):
    if root:
        postOrder(root["children"][0] if len(root["children"]) else None)
        postOrder(root["children"][1] if len(root["children"]) > 1 else None)

        if(len(root["cluster"]) == 0 and len(root["children"])):
            if len(root["children"]) > 1:
                root["cluster"] = root["children"][0]["cluster"] + root["children"][1]["cluster"]
                root["cluster"].sort(key=int)
            else:
                root["cluster"] = root["children"][0]["cluster"]
                root["cluster"].sort(key=int)


sp_similarity_matrix_file = sys.argv[1]
sp_similarity_matrix = pd.read_csv(sp_similarity_matrix_file, index_col=False, usecols=range(1,583))

nsp_similarity_matrix_file = sys.argv[2]
nsp_similarity_matrix = pd.read_csv(sp_similarity_matrix_file, index_col=False, usecols=range(1,583))

names = sp_similarity_matrix.columns

labels = np.asarray(names)
id2name = dict(zip(range(len(labels)), labels))

Z = linkage(sp_similarity_matrix, 'ward')

fig = pylab.figure(figsize=(8,8))
ax1 = fig.add_axes([0.09,0.1,0.2,0.6])
# plt.title('Hierarchical Clustering Dendrogram')
# plt.xlabel('sample index')
# plt.ylabel('distance')

tree = dendrogram(
    Z,
    # truncate_mode='lastp',
    # p=30,
    # leaf_rotation=90.,  # rotates the x axis labels
    # leaf_font_size=8,  # font size for the x axis labels
    color_threshold=5.4,
    # labels=labels,
    orientation='left'
)
ax1.set_xticks([])
ax1.set_yticks([])

ax2 = fig.add_axes([0.3,0.71,0.6,0.2])
Z2 = linkage(nsp_similarity_matrix, 'ward')
tree2 = dendrogram(
    Z2,
    # truncate_mode='lastp',
    # p=30,
    # leaf_rotation=90.,  # rotates the x axis labels
    # leaf_font_size=8,  # font size for the x axis labels
    color_threshold=5.4,
    # labels=labels, orientation='top'
)
ax2.set_xticks([])
ax2.set_yticks([])


# Plot distance matrix.
M = sp_similarity_matrix.values
axmatrix = fig.add_axes([0.3,0.1,0.6,0.6])
idx1 = tree['leaves']
idx2 = tree2['leaves']
D = M[idx1,:]
D = D[:,idx2]
im = axmatrix.matshow(D, aspect='auto', origin='lower', cmap=pylab.cm.YlGnBu)
axmatrix.set_xticks([])
axmatrix.set_yticks([])


# Plot colorbar.
axcolor = fig.add_axes([0.91,0.1,0.02,0.6])
pylab.colorbar(im, cax=axcolor)
fig.show()
fig.savefig('dendrogram.png')

# T = hierarchy.to_tree( Z , rd=False )
# leaves = hierarchy.leaves_list(Z)
#
# d3Dendro = dict(children=[], name="Root1")
# add_node( T, d3Dendro )
#
# postOrder(d3Dendro["children"][0])
#
# #label_tree( d3Dendro["children"][0] )
# json.dump(d3Dendro, open("d3-dendrogram.json", "w"), sort_keys=True, indent=4)

# plt.show()
