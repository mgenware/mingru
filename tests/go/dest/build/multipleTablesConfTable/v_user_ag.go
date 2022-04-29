package da

import "github.com/mgenware/mingru-go-lib"

type VUserAGType struct {
}

var VUser = &VUserAGType{}

// ------------ Actions ------------

func (mrTable *VUserAGType) DeleteByID(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+string(mrFromTable)+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type VUserTableSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

func (mrTable *VUserAGType) SelectProfile(mrQueryable mingru.Queryable, mrFromTable mingru.Table) (VUserTableSelectProfileResult, error) {
	var result VUserTableSelectProfileResult
	err := mrQueryable.QueryRow("SELECT `display_name`, `sig` FROM "+string(mrFromTable)).Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *VUserAGType) UpdateProfile(mrQueryable mingru.Queryable, mrFromTable mingru.Table, sig *string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE "+string(mrFromTable)+" SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
