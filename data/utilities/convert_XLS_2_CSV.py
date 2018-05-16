import xlrd
import csv, sys, os, datetime

m = None
now = datetime.datetime.now()


def csv_from_excel(wkbk, name, sheet):
    wb = xlrd.open_workbook(wkbk)
    sh = wb.sheet_by_name(sheet)
    your_csv_file = open('cluster_' + name[0] + '_' + str(now.month) + '_' + str(now.year) + '_k=' + prefix[1] + '.csv', 'wb')
    wr = csv.writer(your_csv_file, quoting=csv.QUOTE_ALL)

    for rownum in xrange(sh.nrows):
        wr.writerow(sh.row_values(rownum))

    your_csv_file.close()

if __name__ == "__main__":
    directory = sys.argv[1]
    sheet = sys.argv[2]

    for filename in os.listdir(directory):
        if filename.endswith(".xlsx"):
            file_and_path = os.path.join(directory, filename)
            name = file_and_path.split("link=")[1][:-5]
            prefix = name.split("_k=")
            csv_from_excel(file_and_path, prefix, sheet)
            continue
        else:
            continue

