package da

import "github.com/mgenware/mingru-go-lib"

type CommonAGType struct {
}

var Common = &CommonAGType{}

// ------------ Actions ------------

func (mrTable *CommonAGType) Del(mrQueryable mingru.Queryable, userParam mingru.Table, id uint64) error {
	result, err := mrQueryable.Exec("DELETE FROM "+string(userParam)+" WHERE `id` = ?", id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *CommonAGType) Insert(mrQueryable mingru.Queryable, userParam mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO "+string(userParam)+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
