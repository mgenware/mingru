package da

import "github.com/mgenware/mingru-go-lib"

type CommonAGType struct {
}

var Common = &CommonAGType{}

// ------------ Actions ------------

func (mrTable *CommonAGType) Del(mrQueryable mingru.Queryable, mrFromTable string, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+mrFromTable+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *CommonAGType) Insert(mrQueryable mingru.Queryable, mrFromTable string, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+mrFromTable+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

type UserUtilTableSelResult struct {
	DisplayName string
}

func (mrTable *CommonAGType) Sel(mrQueryable mingru.Queryable, mrFromTable string, id uint64) ([]UserUtilTableSelResult, error) {
	rows, err := mrQueryable.Query("SELECT `display_name` FROM "+mrFromTable+" WHERE `id` = ? ORDER BY `display_name`", id)
	if err != nil {
		return nil, err
	}
	var result []UserUtilTableSelResult
	defer rows.Close()
	for rows.Next() {
		var item UserUtilTableSelResult
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

func (mrTable *CommonAGType) Upd(mrQueryable mingru.Queryable, mrFromTable string, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+mrFromTable+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
