package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// T1 ...
func (da *TableTypeUser) T1(queryable mingru.Queryable, id uint64) (Res, error) {
	var result Res
	err := queryable.QueryRow("SELECT `id`, `age` FROM `user` WHERE `id` = ?", id).Scan(&result.ID, &result.Age)
	if err != nil {
		return result, err
	}
	return result, nil
}

// T2 ...
func (da *TableTypeUser) T2(queryable mingru.Queryable, id uint64) (Res, error) {
	var result Res
	err := queryable.QueryRow("SELECT `display_name`, `age`, `follower_c` FROM `user` WHERE `id` = ?", id).Scan(&result.DisplayName, &result.Age, &result.FollowerCount)
	if err != nil {
		return result, err
	}
	return result, nil
}
