package da

import (
	"database/sql"

	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// UserTableTChild1Result ...
type UserTableTChild1Result struct {
	Age  int
	Name string
}

func (da *TableTypeUser) tChild1(queryable dbx.Queryable) (*UserTableTChild1Result, error) {
	result := &UserTableTChild1Result{}
	err := queryable.QueryRow("SELECT `age`, `name` FROM `user`").Scan(&result.Age, &result.Name)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (da *TableTypeUser) tChild2(queryable dbx.Queryable, age int, score int, name string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `user` (`age`, `score`, `name`) VALUES (?, ?, ?)", age, score, name)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}

// T ...
func (da *TableTypeUser) T(db *sql.DB, score int) error {
	txErr := dbx.Transact(db, func(tx *sql.Tx) error {
		var err error
		res, err := da.tChild1(tx)
		if err != nil {
			return err
		}
		_, err = da.tChild2(tx, res.Age, score, res.Name)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
