package da

import "github.com/mgenware/mingru-go-lib"

type VUserAGType struct {
}

var VUser = &VUserAGType{}

// ------------ Actions ------------

func (mrTable *VUserAGType) DeleteByID(mrQueryable mingru.Queryable, userTp mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+string(userTp)+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

type VUserAGSelectProfileResult struct {
	DisplayName string
	Sig         *string
}

func (mrTable *VUserAGType) SelectProfile(mrQueryable mingru.Queryable, userTp mingru.Table) (VUserAGSelectProfileResult, error) {
	var result VUserAGSelectProfileResult
	err := mrQueryable.QueryRow("SELECT `display_name`, `sig` FROM "+string(userTp)).Scan(&result.DisplayName, &result.Sig)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *VUserAGType) UpdateProfile(mrQueryable mingru.Queryable, userTp mingru.Table, sig *string) (int, error) {
	result, err := mrQueryable.Exec("UPDATE "+string(userTp)+" SET `sig` = ?", sig)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
