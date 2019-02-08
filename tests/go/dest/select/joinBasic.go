import "github.com/mgenware/go-packagex/dbx"

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	PostUserUrlName string
	PostTitle       string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable dbx.Queryable) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `join_1`.`url_name` AS `postUserUrlName`, `post`.`title` AS `postTitle` FROM `post` AS `post` INNER JOIN `user` AS `join_1` ON `join_1`.`id` = `post`.`user_id`").Scan(&result.PostUserUrlName, &result.PostTitle)
	if err != nil {
		return nil, err
	}
	return result, nil
}
