package da

import (
	"github.com/mgenware/go-packagex/database/sqlx"
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
func (da *TableTypeUser) SelectProfile(queryable sqlx.Queryable) (*SelectProfileResult, error) {
	result := &SelectProfileResult{}
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.UserDisplayName, &result.UserSig)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateProfile ...
func (da *TableTypeUser) UpdateProfile(queryable sqlx.Queryable, userSig *string) error {
	_, err := queryable.Exec("UPDATE `user` SET `sig` = ?", userSig)
	if err != nil {
		return err
	}
	return nil
}

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable sqlx.Queryable, userID uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", userID)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
