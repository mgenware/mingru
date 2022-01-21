package da

import "github.com/mgenware/mingru-go-lib"

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

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable mingru.Queryable, id uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// UserTableSelectProfileResult ...
type UserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

// SelectProfile ...
func (da *TableTypeUser) SelectProfile(queryable mingru.Queryable) (UserTableSelectProfileResult, error) {
	var result UserTableSelectProfileResult
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

// UpdateProfile ...
func (da *TableTypeUser) UpdateProfile(queryable mingru.Queryable, sig *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
