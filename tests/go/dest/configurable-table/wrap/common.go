package da

import "github.com/mgenware/mingru-go-lib"

type CommonAGType struct {
}

var Common = &CommonAGType{}

// ------------ Actions ------------

func (mrTable *CommonAGType) Del(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+string(mrFromTable)+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *CommonAGType) Insert(mrQueryable mingru.Queryable, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+string(mrFromTable)+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

type MrFromTableTableSelResult struct {
	DisplayName string
}

func (mrTable *CommonAGType) Sel(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) ([]MrFromTableTableSelResult, error) {
	rows, err := mrQueryable.Query("SELECT `display_name` FROM "+string(mrFromTable)+" WHERE `id` = ? ORDER BY `display_name`", id)
	if err != nil {
		return nil, err
	}
	var result []MrFromTableTableSelResult
	defer rows.Close()
	for rows.Next() {
		var item MrFromTableTableSelResult
		err = rows.Scan(&item.DisplayName)
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

func (mrTable *CommonAGType) Upd(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+string(mrFromTable)+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
