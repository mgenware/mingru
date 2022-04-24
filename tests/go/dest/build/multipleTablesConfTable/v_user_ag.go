package da

import "github.com/mgenware/mingru-go-lib"

type VUserAGType struct {
}

var VUserAG = &VUserAGType{}

// ------------ Actions ------------

func (mrTable *VUserAGType) DeleteByID(mrQueryable mingru.Queryable, mrFromTable string, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+mrFromTable+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type VUserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

func (mrTable *VUserAGType) SelectProfile(mrQueryable mingru.Queryable, mrFromTable string) (VUserTableSelectProfileResult, error) {
	var result VUserTableSelectProfileResult
	err := mrQueryable.QueryRow("SELECT `display_name`, `sig` FROM "+mrFromTable).Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *VUserAGType) UpdateProfile(mrQueryable mingru.Queryable, mrFromTable string, sig *string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE "+mrFromTable+" SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
