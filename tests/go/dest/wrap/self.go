import "github.com/mgenware/go-packagex/v5/dbx"

// D ...
func (da *TableTypeUser) D(queryable dbx.Queryable, urlName string, id uint64, followerCount *string) (int, error) {
	return da.S(queryable, urlName, "haha", followerCount, urlName, id, urlName)
}

// S ...
func (da *TableTypeUser) S(queryable dbx.Queryable, urlName string, id uint64, sig *string, followerCount *string) (int, error) {
	result, err := queryable.Exec("UPDATE `user` SET `url_name` = ?, `sig` = ?, `follower_c` = ? WHERE ? ? ?", urlName, sig, followerCount, urlName, id, urlName)
	return dbx.GetRowsAffectedIntWithError(result, err)
}
