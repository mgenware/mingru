package da

import "github.com/mgenware/go-packagex/dbx"

// Type1 ...
type Type1 interface {
	SelectByID(queryable dbx.Queryable, id uint64) (*UserTableSelectByIDResult, error)
	SelectByID(queryable dbx.Queryable, id uint64) (*PostTableSelectByIDResult, error)
}

// Type2 ...
type Type2 interface {
	DeleteByID(queryable dbx.Queryable, id uint64) error
}
