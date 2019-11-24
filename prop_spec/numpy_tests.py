import numpy as np

from fire import Fire


def to_console(f):
    def new_f(*args, **kwargs):
        ret = f(*args, **kwargs)
        print(ret)
    return new_f


if __name__ == "__main__":
    Fire()