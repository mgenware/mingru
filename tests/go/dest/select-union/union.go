package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeActivity ...
type TableTypeActivity struct {
}

// Activity ...
var Activity = &TableTypeActivity{}

// ------------ Actions ------------

// ActivityTableTResult ...
type ActivityTableTResult struct {
	ID          uint64
	GenericSig  *string
	GenericName string
}

// T ...
func (da *TableTypeActivity) T(queryable mingru.Queryable, id uint64) (*ActivityTableTResult, error) {
	result := &ActivityTableTResult{}
	err := queryable.QueryRow("SELECT `id`, `url_name`, `display_name`, `sig`, `age`, `follower_c` FROM `user` WHERE `id` = ?", id).Scan(&result.ID, &result.UrlName, &result.DisplayName, &result.Sig, &result.Age, &result.FollowerCount)
	if err != nil {
		return nil, err
	}
	return result, nil
}
