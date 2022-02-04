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

// DeleteByID ...
func (mrTable *TableTypeUser) DeleteByID(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM `user` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// UserTableSelectProfileResult ...
type UserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

// SelectProfile ...
func (mrTable *TableTypeUser) SelectProfile(mrQueryable mingru.Queryable) (UserTableSelectProfileResult, error) {
	var result UserTableSelectProfileResult
	err := mrQueryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

// UpdateProfile ...
func (mrTable *TableTypeUser) UpdateProfile(mrQueryable mingru.Queryable, sig *string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `user` SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
