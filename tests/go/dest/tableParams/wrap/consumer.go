package da

import "github.com/mgenware/mingru-go-lib"

type ConsumerAGType struct {
}

var Consumer = &ConsumerAGType{}

// ------------ Actions ------------

func (mrTable *ConsumerAGType) AddPost(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return Common.Insert(mrQueryable, TablePost, urlName, displayName, sig, age, followerCount)
}

func (mrTable *ConsumerAGType) AddUser(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return Common.Insert(mrQueryable, TableUser, urlName, displayName, sig, age, followerCount)
}

func (mrTable *ConsumerAGType) DelPost(mrQueryable mingru.Queryable, id uint64) error {
	return Common.Del(mrQueryable, TablePost, id)
}

func (mrTable *ConsumerAGType) SelPost(mrQueryable mingru.Queryable, id uint64) ([]CommonAGSelResult, error) {
	return Common.Sel(mrQueryable, TablePost, id)
}

func (mrTable *ConsumerAGType) UpdPost(mrQueryable mingru.Queryable, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	return Common.Upd(mrQueryable, TablePost, id, urlName, displayName, sig, age, followerCount)
}
