package da

import (
	"database/sql"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// MingruSQLName returns the name of this table.
func (da *TableTypeUser) MingruSQLName() string {
	return "user"
}

// ------------ Actions ------------

// UserTableTChild1Result ...
type UserTableTChild1Result struct {
	Age  int
	Name string
}

func (da *TableTypeUser) tChild1(queryable mingru.Queryable) (UserTableTChild1Result, error) {
	var result UserTableTChild1Result
	err := queryable.QueryRow("SELECT `age`, `name` FROM `user`").Scan(&result.Age, &result.Name)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (da *TableTypeUser) tChild2(queryable mingru.Queryable, age int, score int) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `user` (`age`, `score`, `name`) VALUES (?, ?, ?)", age, score, "FOO")
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

// T ...
func (da *TableTypeUser) T(db *sql.DB, score int) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		res, err := da.tChild1(tx)
		if err != nil {
			return err
		}
		_, err = da.tChild2(tx, res.Age, score)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
