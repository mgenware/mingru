package da

import "github.com/mgenware/go-packagex/dbx"

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
func (da *TableTypeUser) SelectByID(queryable mingru.Queryable, id uint64) (*Res1, error) {
	result := &Res1{}
	err := queryable.QueryRow("SELECT `id` FROM `user` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectProfile ...
func (da *TableTypeUser) SelectProfile(queryable mingru.Queryable) (*Res2, error) {
	result := &Res2{}
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return nil, err
	}
	return result, nil
}
