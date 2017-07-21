import csv
import sys
import json

jsonFile = sys.argv[1]


def flattenjson( b, delim ):
    val = {}
    for i in b.keys():
        if isinstance( b[i], dict ):
            get = flattenjson( b[i], delim )
            for j in get.keys():
                val[ i + delim + j ] = get[j]
        else:
            val[i] = b[i]

    return val

data = None
with open(jsonFile) as file:
    data = json.load(file)

input = map(lambda x: flattenjson(x, "__"), data)
columns = [ x for row in input for x in row.keys() ]
columns = list( set( columns ) )

with open( "test.csv", 'wb' ) as out_file:
    csv_w = csv.writer( out_file )
    csv_w.writerow( columns )

    for i_r in input:
        csv_w.writerow( map( lambda x: i_r.get( x, "" ), columns ) )