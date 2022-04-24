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

func (mrTable *UserAGType) SelectByID(mrQueryable mingru.Queryable, id uint64) (Res1, error) {
	var result Res1
	err := mrQueryable.QueryRow("SELECT `id` FROM `user` WHERE `id` = ?", id).Scan(&result.ID)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *UserAGType) SelectProfile(mrQueryable mingru.Queryable) (Res2, error) {
	var result Res2
	err := mrQueryable.QueryRow("SELECT `display_name`, `sig` FROM `user`").Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}
