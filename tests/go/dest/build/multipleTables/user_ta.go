package da

import (
	"github.com/mgenware/go-packagex/dbx"
)

// TableTypeUser ...
type TableTypeUser struct {
}

// User ...
var User = &TableTypeUser{}

// ------------ Actions ------------

// SelectProfileResult ...
type SelectProfileResult struct {
	UserDisplayName string
	UserSig         *string
}

// SelectProfile ...
func (da *TableTypeUser) SelectProfile(queryable dbx.Queryable) (*SelectProfileResult, error) {
	result := &SelectProfileResult{}
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.UserDisplayName, &result.UserSig)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateProfile ...
func (da *TableTypeUser) UpdateProfile(queryable dbx.Queryable, userSig *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `sig` = ?", userSig)
	return dbx.GetRowsAffectedIntWithError(result, err)
}

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable dbx.Queryable, userID uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", userID)
	return dbx.CheckOneRowAffectedWithError(result, err)
}
