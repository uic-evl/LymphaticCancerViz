import xlrd
import csv, sys, os, datetime

m = None
now = datetime.datetime.now()


def csv_from_excel(wkbk, file_name, version, m_metric, sheet_name):
    wb = xlrd.open_workbook(wkbk)
    sh = wb.sheet_by_name(sheet_name)

    csv_file_name = 'cluster_{0}_{1}_{2}_{3}_k={4}.csv'.format(file_name[0], version, str(now.month),
                                                                   str(now.year), file_name[1])
    print csv_file_name
    your_csv_file = open(csv_file_name, 'wb')
    wr = csv.writer(your_csv_file)

    for row_num in xrange(sh.nrows):
        wr.writerow(sh.row_values(row_num))

    your_csv_file.close()

if __name__ == "__main__":

    root_dir = sys.argv[1]
    sheet = sys.argv[2]

    for subdir, dirs, files in os.walk(root_dir):

        sub_name = subdir.split('\\')[-1]
        if sub_name == 'pvalues':
            continue
        for filename in files:
            if filename.endswith(".xlsx"):
                name = filename.split("link=")[1][:-5]
                metric = filename.split('_')
                if metric[2] == 'PREV' or metric[1] in ['edges', 'jaccard', 'weighted'] \
                    or metric[0] in ['edges', 'jaccard', 'weighted']:
                    continue
                prefix = name.split("_k=")
                print metric
                csv_from_excel(subdir + '\\' + filename, prefix, metric[1], metric[2], sheet)
            else:
                continue

