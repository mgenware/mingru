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

// SelectUserProfileResult ...
type SelectUserProfileResult struct {
	UserDisplayName string
	UserSig         *string
}

// SelectUserProfile ...
func (da *TableTypeUser) SelectUserProfile(queryable sqlx.Queryable, userID uint64) (*SelectUserProfileResult, error) {
	result := &SelectUserProfileResult{}
	err := queryable.QueryRow("SELECT `display_name`, `sig` FROM `user` WHERE `id` = ?", userID).Scan(&result.UserDisplayName, &result.UserSig)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectAllUserProfilesResult ...
type SelectAllUserProfilesResult struct {
	UserDisplayName string
	UserSig         *string
}

// SelectAllUserProfiles ...
func (da *TableTypeUser) SelectAllUserProfiles(queryable sqlx.Queryable) ([]*SelectAllUserProfilesResult, error) {
	rows, err := queryable.Query("SELECT `display_name`, `sig` FROM `user`")
	if err != nil {
		return nil, err
	}
	result := make([]*SelectAllUserProfilesResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &SelectAllUserProfilesResult{}
		err = rows.Scan(&item.UserDisplayName, &item.UserSig)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// SelectUserName ...
func (da *TableTypeUser) SelectUserName(queryable sqlx.Queryable, userID uint64) (string, error) {
	var result string
	err := queryable.QueryRow("SELECT `display_name` FROM `user` WHERE `id` = ?", userID).Scan(&result)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateUserProfile ...
func (da *TableTypeUser) UpdateUserProfile(queryable sqlx.Queryable, userID uint64, userDisplayName string, userSig *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `display_name` = ?, `sig` = ? WHERE `id` = ?", userDisplayName, userSig, userID)
	return sqlx.GetRowsAffectedIntWithError(result, err)
}

// DeleteByID ...
func (da *TableTypeUser) DeleteByID(queryable sqlx.Queryable, userID uint64) error {
	result, err := queryable.Exec("DELETE FROM `user` WHERE `id` = ?", userID)
	return sqlx.CheckOneRowAffectedWithError(result, err)
}
