package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeUserUtil struct {
}

var UserUtil = &TableTypeUserUtil{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUserUtil) MingruSQLName() string {
	return "user_util"
}

// ------------ Actions ------------

func (mrTable *TableTypeUserUtil) Del(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+mrFromTable.MingruSQLName()+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *TableTypeUserUtil) Insert(mrQueryable mingru.Queryable, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+mrFromTable.MingruSQLName()+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

type UserUtilTableSelResult struct {
	DisplayName string
}

func (mrTable *TableTypeUserUtil) Sel(mrQueryable mingru.Queryable, mrFromTable mingru.Table, id uint64) ([]UserUtilTableSelResult, error) {
	rows, err := mrQueryable.Query("SELECT `display_name` FROM "+mrFromTable.MingruSQLName()+" WHERE `id` = ? ORDER BY `display_name`", id)
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

func (mrTable *TableTypeUserUtil) Upd(mrQueryable mingru.Queryable, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string, id uint64) error {
	result, err := mrQueryable.Exec("UPDATE "+mrFromTable.MingruSQLName()+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
