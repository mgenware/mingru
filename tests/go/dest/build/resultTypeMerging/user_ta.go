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

// T1 ...
func (mrTable *TableTypeUser) T1(mrQueryable mingru.Queryable, id uint64) (Res, error) {
	var result Res
	err := mrQueryable.QueryRow("SELECT `id`, `age` FROM `user` WHERE `id` = ?", id).Scan(&result.ID, &result.Age)
	if err != nil {
		return result, err
	}
	return result, nil
}

// T2 ...
func (mrTable *TableTypeUser) T2(mrQueryable mingru.Queryable, id uint64) (Res, error) {
	var result Res
	err := mrQueryable.QueryRow("SELECT `display_name`, `age`, `follower_c` FROM `user` WHERE `id` = ?", id).Scan(&result.DisplayName, &result.Age, &result.FollowerCount)
	if err != nil {
		return result, err
	}
	return result, nil
}
