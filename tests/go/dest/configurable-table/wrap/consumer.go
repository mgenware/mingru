package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) AddPost(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(mrQueryable, Post, urlName, displayName, sig, age, followerCount)
}

func (mrTable *TableTypePost) AddUser(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(mrQueryable, User, urlName, displayName, sig, age, followerCount)
}

func (mrTable *TableTypePost) DelPost(mrQueryable mingru.Queryable, id uint64) error {
	return UserUtil.Del(mrQueryable, Post, id)
}

func (mrTable *TableTypePost) SelPost(mrQueryable mingru.Queryable, id uint64) ([]UserUtilTableSelResult, error) {
	return UserUtil.Sel(mrQueryable, Post, id)
}

func (mrTable *TableTypePost) UpdPost(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string, id uint64) error {
	return UserUtil.Upd(mrQueryable, Post, urlName, displayName, sig, age, followerCount, id)
}
