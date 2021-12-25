package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable mingru.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// SelectByID ...
func (da *TableTypeUser) SelectByID(queryable mingru.Queryable, id uint64) (Res1, error) {
	var result Res1
	err := queryable.QueryRow("SELECT `id` FROM `user` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}

// SelectProfile ...
func (da *TableTypeUser) SelectProfile(queryable mingru.Queryable) (Res2, error) {
	var result Res2
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

// SelectProfile2 ...
func (da *TableTypeUser) SelectProfile2(queryable mingru.Queryable) (Res3, error) {
	var result Res3
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}
