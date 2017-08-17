import csv, sys
import numpy as np

firstline = True
matrix = np.zeros((290,290))

data = sys.argv[1]

header = []
for i in range(0, 291):
    if i == 0:
        header.append("")
    else:
        header.append("Patient " + str(i))
print ','.join(map(str, header))
# print '~'
with open(data, 'r') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for row in reader:
        if firstline:
            firstline = False
            continue

        rank = []
        scores = []
        idx = int(row[0])
        
        for i in range(1, 278):
            rank.append(row[i])
        for j in range(278, 555):
            scores.append(row[j])
        for l in rank:
            r = int(l)
            if r == idx:
                score = -1
            else:
                loc = rank.index(l)
                score = scores[loc]
            matrix[idx, r] = score


for i in range(1,len(matrix)):
    patient = matrix[i].tolist()
    patient[0] = "Patient " + str(i)
    print ','.join(map(str, patient))
    # print '~'
