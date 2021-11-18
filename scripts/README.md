# Scripts

_A directory for shell and python scripts_

...Because I don't like writing Makefiles.

- [`bundle.sh`](https://github.com/CDCgov/MicrobeTrace/blob/dev/scripts/bundle.sh) -
  Takes all the JS and CSS dependencies and packages them into bundle files (see
  the contents of
  [`dist/`](https://github.com/CDCgov/MicrobeTrace/tree/dev/dist)).

- [`compress.sh`](https://github.com/CDCgov/MicrobeTrace/blob/dev/scripts/compress.sh) -
  Generates compressed versions of the largest, most important files to
  MicrobeTrace. On systems that run
  [`server.js`](https://github.com/CDCgov/MicrobeTrace/blob/dev/server.js), the
  compressed versions will get served, resulting in faster loadtimes.

- [`cleanup.sh`](https://github.com/CDCgov/MicrobeTrace/blob/dev/scripts/compress.sh) -
  Removes all compressed files.

- [`sw.sh`](https://github.com/CDCgov/MicrobeTrace/blob/dev/scripts/sw.sh) -
  Regenerates [`sw.js`](https://github.com/CDCgov/MicrobeTrace/blob/dev/sw.js)
  based on the current contents of the relevant directories.

- [`excise.sh`](https://github.com/CDCgov/MicrobeTrace/blob/dev/scripts/excise.sh) -
  Deletes everything MicrobeTrace doesn't need in order to run. **Don't use this
  unless you're deploying to a system with very little free space, or other
  weird constraints.**

- [`make_example_link_list.py`](https://github.com/CDCgov/MicrobeTrace/blob/dev/scripts/make_example_link_list.py) -
  Generates an example link list with randomly generated node ids. The script can set
  the total number of nodes to generate, cluster size and the number of links generated 
  within each cluster.

    usage: make_example_link_list.py [-h] [--num_nodes NUM_NODES]
                                     [--range_start RANGE_START]
                                     [--range_finish RANGE_FINISH]
                                     [--min_chunk_size MIN_CHUNK_SIZE]
                                     [--max_chunk_size MAX_CHUNK_SIZE]
                                     [--min_combs_chosen MIN_COMBS_CHOSEN]
                                     [--max_combs_chosen MAX_COMBS_CHOSEN]
                                     [--outfile OUTFILE]

    optional arguments:
      -h, --help            show this help message and exit
      --num_nodes NUM_NODES
                            How many nodes to generate
      --range_start RANGE_START
                            ID at beginning of range
      --range_finish RANGE_FINISH
                            ID at end of range
      --min_chunk_size MIN_CHUNK_SIZE
                            Minimum nodes per cluster
      --max_chunk_size MAX_CHUNK_SIZE
                            Maximum nodes per cluster
      --min_combs_chosen MIN_COMBS_CHOSEN
                            Minimum number of combinations to select from a
                            cluster
      --max_combs_chosen MAX_COMBS_CHOSEN
                            Maximum number of combinations to select from a
                            cluster
      --outfile OUTFILE     Name of the file to create
