package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUser) MingruSQLName() string {
	return "user"
}

// ------------ Actions ------------

// SelectByID ...
func (mrTable *TableTypeUser) SelectByID(mrQueryable mingru.Queryable, id uint64) (Res1, error) {
	var result Res1
	err := mrQueryable.QueryRow("SELECT `id` FROM `user` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}
