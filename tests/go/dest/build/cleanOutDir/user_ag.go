package da

import "github.com/mgenware/mingru-go-lib"

type UserAGType struct {
}

var UserAG = &UserAGType{}

// ------------ Actions ------------

func (mrTable *UserAGType) DeleteByID(mrQueryable mingru.Queryable, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM `user` WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type UserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

func (mrTable *UserAGType) SelectProfile(mrQueryable mingru.Queryable) (UserTableSelectProfileResult, error) {
	var result UserTableSelectProfileResult
	err := mrQueryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *UserAGType) UpdateProfile(mrQueryable mingru.Queryable, sig *string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `user` SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
