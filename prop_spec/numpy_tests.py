import numpy as np

from fire import Fire


def to_console(f):
    def new_f(*args, **kwargs):
        ret = f(*args, **kwargs)
        print(ret)
    return new_f


def json_to_np(json: dict) -> np.ndarray:
    raise NotImplementedError


def np_to_json(array: np.ndarray) -> dict:
    raise NotImplementedError


@to_console
def add_arrays():
    raise NotImplementedError


@to_console
def hello():
    print("Hello")


if __name__ == "__main__":
    Fire()