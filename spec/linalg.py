import numpy as np
import numpy.linalg as nla


np.set_printoptions(suppress=True)

# G&vL 3rd pg. 210
def make_house_vec(x):
    n = x.shape[0]
    dot_1on = x[1:].dot(x[1:])

    # v is our return vector; we hack on v[0]
    v = np.copy(x)
    v[0] = 1.0
    
    if dot_1on < np.finfo(float).eps:
        beta = 0.0
    else:
        # apply Parlett's formula (G&vL page 210) for safe v_0 = x_0 - norm(X) 
        norm_x= np.sqrt(x[0]**2 + dot_1on)
        print(norm_x)
        if x[0] <= 0:
            v[0] = x[0] - norm_x
        else:
            v[0] = -dot_1on / (x[0] + norm_x)
        beta = 2 * v[0]**2 / (dot_1on + v[0]**2)
        v = v / v[0]
    return v, beta


def full_house(n, col, v, beta):
    ''' for size n, apply a Householder vector v in the lower right corner of 
        I_n to get a full-sized matrix with a smaller Householder matrix component'''
    full = np.eye(n)
    full[col:, col:] -= beta * np.outer(v,v)
    return full

# G&VL Algo. 5.4.2 with explicit reflections
def house_bidiag_explicit_UV(A):
    m,n = A.shape
    assert m >= n
    U,Vt = np.eye(m), np.eye(n)
    
    for col in range(n):
        v, beta = make_house_vec(A[col:,col])
        diff = (np.eye(m-col) - beta * np.outer(v,v))
        intermediate = diff.dot(A[col:,col:])
        print(intermediate)
        A[col:,col:] = intermediate
        Q = full_house(m, col, v, beta)
        U = U.dot(Q)
        
        if col <= n-2:
            # transpose here, reflection for zeros above diagonal in A
            # col+1 keeps us off the super diagonal
            v,beta = make_house_vec(A[col,col+1:].T)
            A[col:,col+1:] = A[col:, col+1:].dot(np.eye(n-(col+1)) - beta * np.outer(v,v))
            P = full_house(n, col+1, v, beta)
            Vt = P.dot(Vt)
    return U, A, Vt

def apply_house_left(submatrix, hvec, beta, rotation, fullrows):
    m,n = submatrix.shape
    
    # A needs a reduced H (just the bottom-right); 
    # rotation needs a full H
    fullH = np.eye(fullrows)
    partH = fullH[fullrows-m:, fullrows-m:]
    partH -=  beta*np.outer(hvec,hvec)
    
    # mutate instead of (new) object assignment
    submatrix[:] = partH.dot(submatrix)
    rotation[:] = rotation.dot(fullH)


def apply_house_right(submatrix, hvec, beta, rotation, fullcols):
    m,n = submatrix.shape

    # A needs a reduced H (just the bottom-right); 
    # rotation needs a full H
    fullH = np.eye(fullcols)
    partH = fullH[fullcols-n:, fullcols-n:] # fillable = fullcols - m  
    partH -= beta*np.outer(hvec,hvec)
    
    # mutate instead of (new) object assignment
    submatrix[:] = submatrix.dot(partH)
    rotation[:]  = fullH.dot(rotation)

def hbd_simple(A):
    m,n = A.shape
    U,Vt = np.eye(m), np.eye(n)
    
    for col in range(n):
        # zero down the column
        u, beta_u = make_house_vec(A[col:,col])
        apply_house_left(A[col:, col:], u, beta_u, U, m)
        if col <= n-2:
            # zero across the row
            v, beta_v = make_house_vec(A[col,col+1:].T)
            apply_house_right(A[col:, col+1:], v, beta_v, Vt, n)
    return U, A, Vt

a = np.array([
    [1, 6,  11, 16],
    [2, 7, 12, 17],
    [3, 8, 13, 0.5],
    [4, 9, 14, 0.1],
    [5, 10, 15, 100]
], dtype=np.float64)

u, b, v = house_bidiag_explicit_UV(a)
print(u)
# print(v)
import pdb
pdb.set_trace()

# u1, b1, _ = hbd_simple(a)
# print(b1)

# a = np.array([
#     [1, 6,  11],
#     [2, 7, 12],
#     [3, 8, 13],
#     [4, 9, 14],
#     [5, 10, 15]
# ], dtype=np.float64)

# vec, beta = make_house_vec(a[0:, 0])
# print(vec)