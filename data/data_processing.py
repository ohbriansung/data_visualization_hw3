"""
Author: Brian Sung
"""
import csv


with open('Tree_Maintenance_March_2018_to_2019.csv', 'r') as inp\
    , open('_tree_maintenance_march_2018_to_2019.csv', 'w') as out:

    header = [
        'Source',
        'Address',
        'Request Details',
        'Opened',
        'Closed',
        'Status',
        'Supervisor District',
        'Neighborhood',
        'Latitude',
        'Longitude',
        'Media URL',
    ]

    writer = csv.DictWriter(out, fieldnames=header)
    writer.writeheader()
    reader = csv.DictReader(inp)

    for row in reader:
        dist = {}
        for key in header:
            dist[key] = row[key]
        writer.writerow(dist)
