package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable dbx.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", id)
	return dbx.CheckOneRowAffectedWithError(result, err)
}

// UserTableSelectProfileResult ...
type UserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

// SelectProfile ...
func (da *TableTypeUser) SelectProfile(queryable dbx.Queryable) (*UserTableSelectProfileResult, error) {
	result := &UserTableSelectProfileResult{}
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateProfile ...
func (da *TableTypeUser) UpdateProfile(queryable dbx.Queryable, sig *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `sig` = ?", sig)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
