package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeVUser ...
type TableTypeVUser struct {
}

// VUser ...
var VUser = &TableTypeVUser{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeVUser) MingruSQLName() string {
	return "v_user"
}

// ------------ Actions ------------

// DeleteByID ...
func (mrTable *TableTypeVUser) DeleteByID(queryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := queryable.Exec("DELETE FROM "+mrFromTable.MingruSQLName()+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

// VUserTableSelectProfileResult ...
type VUserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

// SelectProfile ...
func (mrTable *TableTypeVUser) SelectProfile(queryable mingru.Queryable, mrFromTable mingru.Table) (VUserTableSelectProfileResult, error) {
	var result VUserTableSelectProfileResult
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM "+mrFromTable.MingruSQLName()).Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

// UpdateProfile ...
func (mrTable *TableTypeVUser) UpdateProfile(queryable mingru.Queryable, mrFromTable mingru.Table, sig *string) (int, error) {
	result, err := queryable.Exec("UPDATE "+mrFromTable.MingruSQLName()+" SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}