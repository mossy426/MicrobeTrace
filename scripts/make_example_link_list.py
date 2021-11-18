#!/usr/bin/env python3

import math
import random
from itertools import islice
from random import randint
from itertools import combinations
import argparse


def main(args):
    id_list = make_id_list(args.num_nodes, range_start=args.range_start, range_finish=args.range_finish)
    rand_chunks = list(random_chunk(id_list, min_chunk=args.min_chunk_size, max_chunk=args.max_chunk_size))
    final_link_list = choose_random_combinations(rand_chunks, min_combs=args.min_combs_chosen, max_combs=args.max_combs_chosen)
    save_link_list(final_link_list, args.outfile)


def save_link_list(link_list, filename):
    '''Write the selected combinations out to a CSV file for 
    import into MicrobeTrace
    '''
    with open(filename, 'w') as cvf:
        cvf.write("Source, Target\n")
        for li in link_list:
            cvf.write(f"{li[0]}, {li[1]}\n")
        

def random_chunk(li, min_chunk=10, max_chunk=20):
    '''Split the list of IDs into chunks between min_chunk and max_chunk size
    '''
    it = iter(li)
    while True:
        nxt = list(islice(it,randint(min_chunk,max_chunk)))
        if nxt:
            yield nxt
        else:
            break


def make_id_list(list_length, range_start=10000, range_finish=99999):
    '''Generate a list of ID numbers (by default with five digits)
    '''
    id_list = []
    while len(id_list) < list_length:
        new_num = random.randrange(range_start, range_finish)
        if not id_list:
            id_list = [new_num]
        elif new_num not in id_list:
            id_list.append(new_num)
    return id_list


def choose_random_combinations(rand_chunks, min_combs=12, max_combs=25):
    '''Select a random set of between min_combs and max_combs possible combinations 
    in a cluster
    '''
    final_link_list = []
    for chunk in rand_chunks:
        combs = random.choices(list(combinations(chunk, 2)), k=random.randrange(min_combs, max_combs))
        print(combs)
        final_link_list += combs
    return final_link_list
            

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--num_nodes", help="How many nodes to generate", type=int, default=5000, required=False)
    parser.add_argument("--range_start", help="ID at beginning of range", type=int, default=10000, required=False)
    parser.add_argument("--range_finish", help="ID at end of range", type=int, default=99999, required=False)
    parser.add_argument("--min_chunk_size", help="Minimum nodes per cluster", type=int, default=10, required=False)
    parser.add_argument("--max_chunk_size", help="Maximum nodes per cluster", type=int, default=20, required=False)
    parser.add_argument("--min_combs_chosen", help="Minimum number of combinations to select from a cluster", type=int, default=12, required=False)
    parser.add_argument("--max_combs_chosen", help="Maximum number of combinations to select from a cluster", type=int, default=25, required=False)
    parser.add_argument("--outfile", help="Name of the file to create", default="example_link_list.csv", required=False)
    args = parser.parse_args()
    main(args)
