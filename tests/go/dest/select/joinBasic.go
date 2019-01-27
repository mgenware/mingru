import "github.com/mgenware/go-packagex/dbx"

// SelectTResult ...
type SelectTResult struct {
	PostUserUrlName string
	PostTitle       string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*SelectTResult, error) {
	result := &SelectTResult{}
	err := queryable.QueryRow("SELECT `_join_1`.`url_name` AS `postUserUrlName`, `_main`.`title` AS `postTitle` FROM `post` AS `_main` INNER JOIN `user` AS `_join_1` ON `_join_1`.`id` = `_main`.`user_id`").Scan(&result.PostUserUrlName, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}
